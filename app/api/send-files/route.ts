import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAuthorizedClient, findOrCreateFolder } from '@/lib/google'
import { getCurrentUserId } from '@/lib/session-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function base64Url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function buildRawEmail(params: { from: string; to: string; fileName: string; mimeType: string; fileContent: Buffer }): string {
  const { from, to, fileName, mimeType, fileContent } = params
  const boundary = `__boundary_${Math.random().toString(36).slice(2)}__`
  const safeName = fileName.replace(/"/g, '')
  const attachment = fileContent.toString('base64')
  // Split base64 into 76-char lines per RFC 2045
  const attachmentFormatted = attachment.replace(/(.{76})/g, '$1\r\n')

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    'Subject: ',
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
  ].join('\r\n')

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    '',
    `--${boundary}`,
    `Content-Type: ${mimeType}; name="${safeName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${safeName}"`,
    '',
    attachmentFormatted,
    `--${boundary}--`,
    '',
  ].join('\r\n')

  return `${headers}\r\n${body}`
}

async function downloadDriveFile(drive: any, fileId: string, mimeType: string): Promise<{ data: Buffer; mimeType: string; extension: string } | null> {
  try {
    // Google Workspace files need to be exported
    if (mimeType?.startsWith?.('application/vnd.google-apps.')) {
      const exportMap: Record<string, { mime: string; ext: string }> = {
        'application/vnd.google-apps.document': { mime: 'application/pdf', ext: 'pdf' },
        'application/vnd.google-apps.spreadsheet': { mime: 'application/pdf', ext: 'pdf' },
        'application/vnd.google-apps.presentation': { mime: 'application/pdf', ext: 'pdf' },
        'application/vnd.google-apps.drawing': { mime: 'application/pdf', ext: 'pdf' },
      }
      const target = exportMap[mimeType] ?? { mime: 'application/pdf', ext: 'pdf' }
      const res = await drive.files.export({ fileId, mimeType: target.mime }, { responseType: 'arraybuffer' })
      return { data: Buffer.from(res.data as ArrayBuffer), mimeType: target.mime, extension: target.ext }
    }
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
    return { data: Buffer.from(res.data as ArrayBuffer), mimeType: mimeType || 'application/octet-stream', extension: '' }
  } catch {
    return null
  }
}

export async function POST() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { oauth2, account, error } = await getAuthorizedClient(userId)
  if (!oauth2) return NextResponse.json({ error: error ?? 'Auth error' }, { status: 400 })

  let settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings) settings = await prisma.settings.create({ data: { userId } })

  const from = account?.googleEmail ?? 'me'
  const recipient = settings.recipientEmail
  const sourceFolder = settings.sourceFolder

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2 })
    const gmail = google.gmail({ version: 'v1', auth: oauth2 })

    const folder = await findOrCreateFolder(drive, sourceFolder)
    if (!folder.id) return NextResponse.json({ error: folder.error ?? `Source folder "${sourceFolder}" not found` }, { status: 404 })
    const folderId = folder.id

    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType, size)',
      pageSize: 1000,
      orderBy: 'name',
    })
    const files = listRes?.data?.files ?? []

    if (files.length === 0) {
      await prisma.activityLog.create({
        data: { userId, action: 'INFO', status: 'SUCCESS', message: `No files found in folder "${sourceFolder}"` },
      })
      return NextResponse.json({ sent: 0, failed: 0, total: 0, recipient, message: 'No files found in source folder' })
    }

    let sent = 0
    let failed = 0
    const results: Array<{ name: string; ok: boolean; error?: string }> = []

    for (const f of files) {
      try {
        const downloaded = await downloadDriveFile(drive, f.id!, f.mimeType ?? 'application/octet-stream')
        if (!downloaded) throw new Error('Failed to download file from Drive')

        let fileName = f.name ?? 'file'
        if (downloaded.extension && !fileName.toLowerCase().endsWith('.' + downloaded.extension)) {
          fileName = `${fileName}.${downloaded.extension}`
        }

        const raw = buildRawEmail({ from, to: recipient, fileName, mimeType: downloaded.mimeType, fileContent: downloaded.data })
        await gmail.users.messages.send({ userId: 'me', requestBody: { raw: base64Url(raw) } })

        sent += 1
        results.push({ name: fileName, ok: true })
        await prisma.activityLog.create({
          data: { userId, action: 'SEND_FILE', fileName, fileId: f.id ?? null, recipient, status: 'SUCCESS', message: `Sent to ${recipient}` },
        })
      } catch (e: any) {
        failed += 1
        results.push({ name: f.name ?? 'file', ok: false, error: e?.message ?? 'unknown error' })
        await prisma.activityLog.create({
          data: { userId, action: 'SEND_FILE', fileName: f.name ?? null, fileId: f.id ?? null, recipient, status: 'FAILED', message: e?.message ?? 'unknown error' },
        })
      }
    }

    return NextResponse.json({ sent, failed, total: files.length, recipient, results })
  } catch (e: any) {
    await prisma.activityLog.create({
      data: { userId, action: 'ERROR', status: 'FAILED', message: `Send files error: ${e?.message ?? 'unknown'}` },
    })
    return NextResponse.json({ error: e?.message ?? 'Send error' }, { status: 500 })
  }
}
