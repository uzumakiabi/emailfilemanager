import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { promises as fs } from 'fs'
import path from 'path'
import Store from 'electron-store'
import type { AppSettings, SendFilesResult, CheckResponsesResult } from './types'
import { addLog } from './store'

const syncStore = new Store<{ lastUid: Record<string, number> }>({ name: 'sync', defaults: { lastUid: {} } })

function syncKey(settings: AppSettings): string {
  return `${settings.email.toLowerCase()}::${settings.recipientEmail.toLowerCase()}`
}

function getTransporter(settings: AppSettings) {
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: { user: settings.email.trim(), pass: settings.appPassword.trim() },
  })
}

function assertCredentials(settings: AppSettings) {
  if (!settings.email?.trim() || !settings.appPassword?.trim()) {
    throw new Error('Email account is not configured. Go to Settings, enter your email + app password, and click "Save settings".')
  }
}

export async function sendFiles(settings: AppSettings, filePaths: string[]): Promise<SendFilesResult> {
  assertCredentials(settings)
  if (!settings.recipientEmail) {
    throw new Error('Recipient email is not set. Go to Settings and enter a recipient email.')
  }

  const transporter = getTransporter(settings)
  const results: SendFilesResult['results'] = []
  let sent = 0
  let failed = 0

  for (const filePath of filePaths) {
    const fileName = path.basename(filePath)
    try {
      await fs.access(filePath)
      await transporter.sendMail({
        from: settings.email.trim(),
        to: settings.recipientEmail.trim(),
        subject: '',
        text: '',
        attachments: [{ filename: fileName, path: filePath }],
      })
      sent += 1
      results.push({ name: fileName, ok: true })
      addLog({ action: 'SEND_FILE', fileName, recipient: settings.recipientEmail, status: 'SUCCESS', message: `Sent to ${settings.recipientEmail}` })
    } catch (e: any) {
      failed += 1
      results.push({ name: fileName, ok: false, error: e?.message ?? 'unknown error' })
      addLog({ action: 'SEND_FILE', fileName, recipient: settings.recipientEmail, status: 'FAILED', message: e?.message ?? 'unknown error' })
    }
  }

  return { sent, failed, total: filePaths.length, recipient: settings.recipientEmail, results }
}

export async function checkResponses(settings: AppSettings): Promise<CheckResponsesResult> {
  assertCredentials(settings)
  if (!settings.recipientEmail) {
    throw new Error('Recipient email is not set. Go to Settings and enter a recipient email.')
  }
  if (!settings.downloadFolder) {
    throw new Error('Download folder is not set. Go to Settings and choose a folder for downloaded attachments.')
  }

  await fs.mkdir(settings.downloadFolder, { recursive: true })

  const client = new ImapFlow({
    host: settings.imapHost,
    port: settings.imapPort,
    secure: true,
    auth: { user: settings.email.trim(), pass: settings.appPassword.trim() },
    logger: false,
  })

  const key = syncKey(settings)
  const lastUidMap = (syncStore.get('lastUid') as Record<string, number>) ?? {}
  const lastUid = lastUidMap[key] ?? 0

  let downloaded = 0
  let failed = 0
  let messageCount = 0
  const results: CheckResponsesResult['results'] = []
  let maxUidSeen = lastUid

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    try {
      const searchCriteria: any = { from: settings.recipientEmail }
      if (lastUid > 0) searchCriteria.uid = `${lastUid + 1}:*`

      const uids = await client.search(searchCriteria, { uid: true })
      const list = (uids ?? []).filter((uid: number) => uid > lastUid)
      messageCount = list.length

      for (const uid of list) {
        try {
          const message = await client.fetchOne(String(uid), { source: true }, { uid: true })
          if (!message || !message.source) continue
          if (uid > maxUidSeen) maxUidSeen = uid

          const parsed = await simpleParser(message.source)
          const subject = parsed.subject || '(no subject)'
          const attachments = parsed.attachments ?? []

          if (attachments.length === 0) continue

          for (const att of attachments) {
            const fileName = att.filename || `attachment-${uid}`
            try {
              const destPath = path.join(settings.downloadFolder, fileName)
              await fs.writeFile(destPath, att.content)
              downloaded += 1
              results.push({ name: fileName, ok: true })
              addLog({ action: 'RECEIVE_FILE', fileName, sender: settings.recipientEmail, status: 'SUCCESS', message: `Saved to "${settings.downloadFolder}" (email: ${subject})` })
            } catch (e: any) {
              failed += 1
              results.push({ name: fileName, ok: false, error: e?.message ?? 'unknown' })
              addLog({ action: 'RECEIVE_FILE', fileName, sender: settings.recipientEmail, status: 'FAILED', message: e?.message ?? 'unknown' })
            }
          }
        } catch (e: any) {
          failed += 1
          addLog({ action: 'RECEIVE_FILE', sender: settings.recipientEmail, status: 'FAILED', message: `Message uid ${uid} error: ${e?.message ?? 'unknown'}` })
        }
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout().catch(() => {})
  }

  if (maxUidSeen > lastUid) {
    lastUidMap[key] = maxUidSeen
    syncStore.set('lastUid', lastUidMap)
  }

  if (messageCount === 0) {
    addLog({ action: 'INFO', status: 'SUCCESS', message: `No new emails from ${settings.recipientEmail}` })
  }

  return { messages: messageCount, downloaded, failed, results }
}

export async function testConnection(settings: AppSettings): Promise<{ smtp: boolean; imap: boolean; error?: string }> {
  const out = { smtp: false, imap: false, error: undefined as string | undefined }
  try {
    assertCredentials(settings)
  } catch (e: any) {
    return { ...out, error: e?.message ?? 'Missing credentials' }
  }
  try {
    const transporter = getTransporter(settings)
    await transporter.verify()
    out.smtp = true
  } catch (e: any) {
    out.error = `SMTP: ${e?.message ?? 'failed'}`
  }
  try {
    const client = new ImapFlow({
      host: settings.imapHost,
      port: settings.imapPort,
      secure: true,
      auth: { user: settings.email.trim(), pass: settings.appPassword.trim() },
      logger: false,
    })
    await client.connect()
    await client.logout()
    out.imap = true
  } catch (e: any) {
    out.error = `${out.error ? out.error + ' | ' : ''}IMAP: ${e?.message ?? 'failed'}`
  }
  return out
}
