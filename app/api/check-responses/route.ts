import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAuthorizedClient, findOrCreateFolder } from '@/lib/google'
import { getCurrentUserId } from '@/lib/session-helpers'
import { prisma } from '@/lib/db'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const PROCESSED_LABEL = 'EFM-Processed'

async function ensureLabel(gmail: any, name: string): Promise<string | null> {
  try {
    const list = await gmail.users.labels.list({ userId: 'me' })
    const existing = (list?.data?.labels ?? []).find((l: any) => l?.name === name)
    if (existing?.id) return existing.id
    const created = await gmail.users.labels.create({
      userId: 'me',
      requestBody: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
    })
    return created?.data?.id ?? null
  } catch {
    return null
  }
}

function collectAttachments(payload: any, acc: Array<{ filename: string; attachmentId: string; mimeType: string }> = []) {
  if (!payload) return acc
  if (payload?.filename && payload?.body?.attachmentId) {
    acc.push({
      filename: payload.filename,
      attachmentId: payload.body.attachmentId,
      mimeType: payload.mimeType ?? 'application/octet-stream',
    })
  }
  const parts = payload?.parts ?? []
  for (const p of parts) collectAttachments(p, acc)
  return acc
}

export async function POST() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { oauth2, error } = await getAuthorizedClient(userId)
  if (!oauth2) return NextResponse.json({ error: error ?? 'Auth error' }, { status: 400 })

  let settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings) settings = await prisma.settings.create({ data: { userId } })

  const recipient = settings.recipientEmail
  const destFolder = settings.destinationFolder

  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2 })
    const drive = google.drive({ version: 'v3', auth: oauth2 })

    const destFolderRes = await findOrCreateFolder(drive, destFolder)
    if (!destFolderRes.id) return NextResponse.json({ error: destFolderRes.error ?? `Destination folder "${destFolder}" could not be created` }, { status: 500 })
    const destFolderId = destFolderRes.id

    const processedLabelId = await ensureLabel(gmail, PROCESSED_LABEL)

    // Query for unprocessed messages from the sender with attachments
    const q = `from:${recipient} has:attachment${processedLabelId ? ` -label:${PROCESSED_LABEL}` : ''}`
    const msgList = await gmail.users.messages.list({ userId: 'me', q, maxResults: 100 })
    const messages = msgList?.data?.messages ?? []

    if (messages.length === 0) {
      await prisma.activityLog.create({
        data: { userId, action: 'INFO', status: 'SUCCESS', message: `No new emails from ${recipient}` },
      })
      return NextResponse.json({ processed: 0, downloaded: 0, failed: 0, messages: 0, message: 'No new emails with attachments' })
    }

    let downloaded = 0
    let failed = 0
    const results: Array<{ name: string; ok: boolean; error?: string }> = []

    for (const m of messages) {
      try {
        const msg = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'full' })
        const payload = msg?.data?.payload
        const headers = payload?.headers ?? []
        const subject = headers.find((h: any) => h?.name?.toLowerCase?.() === 'subject')?.value ?? '(no subject)'
        const attachments = collectAttachments(payload)

        for (const att of attachments) {
          try {
            const attRes = await gmail.users.messages.attachments.get({ userId: 'me', messageId: m.id!, id: att.attachmentId })
            const data = attRes?.data?.data
            if (!data) throw new Error('Empty attachment data')
            const buf = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

            const filename = att.filename || `attachment-${m.id}`
            const stream = Readable.from(buf)
            await drive.files.create({
              requestBody: { name: filename, parents: [destFolderId] },
              media: { mimeType: att.mimeType, body: stream },
              fields: 'id, name',
            })

            downloaded += 1
            results.push({ name: filename, ok: true })
            await prisma.activityLog.create({
              data: { userId, action: 'RECEIVE_FILE', fileName: filename, sender: recipient, status: 'SUCCESS', message: `Saved to "${destFolder}" (email: ${subject})` },
            })
          } catch (e: any) {
            failed += 1
            results.push({ name: att.filename || 'attachment', ok: false, error: e?.message ?? 'unknown' })
            await prisma.activityLog.create({
              data: { userId, action: 'RECEIVE_FILE', fileName: att.filename ?? null, sender: recipient, status: 'FAILED', message: e?.message ?? 'unknown' },
            })
          }
        }

        // Mark as processed
        if (processedLabelId) {
          try {
            await gmail.users.messages.modify({ userId: 'me', id: m.id!, requestBody: { addLabelIds: [processedLabelId] } })
          } catch {}
        }
      } catch (e: any) {
        failed += 1
        await prisma.activityLog.create({
          data: { userId, action: 'RECEIVE_FILE', sender: recipient, status: 'FAILED', message: `Message ${m.id} error: ${e?.message ?? 'unknown'}` },
        })
      }
    }

    return NextResponse.json({
      processed: messages.length,
      messages: messages.length,
      downloaded,
      failed,
      results,
    })
  } catch (e: any) {
    await prisma.activityLog.create({
      data: { userId, action: 'ERROR', status: 'FAILED', message: `Check responses error: ${e?.message ?? 'unknown'}` },
    })
    return NextResponse.json({ error: e?.message ?? 'Check error' }, { status: 500 })
  }
}
