import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { promises as fs } from 'fs'
import path from 'path'
import Store from 'electron-store'
import type { AppSettings, SendFilesResult, CheckResponsesResult } from './types'
import { addLog, saveSettings } from './store'
import { refreshAccessToken } from './oauth'
import { getProviderCredentials } from './admin'
import { PROVIDER_PRESETS } from './providers'

/**
 * Always resolve SMTP/IMAP connection params from the known provider preset
 * (rather than trusting persisted settings, which can drift/desync across
 * versions or platforms) so a Gmail/Outlook/Yahoo account never ends up
 * pointed at the wrong host/port/secure combination.
 */
function resolveConnectionParams(settings: AppSettings) {
  const preset = settings.provider !== 'custom' ? PROVIDER_PRESETS[settings.provider] : null
  return {
    smtpHost: preset ? preset.smtpHost : settings.smtpHost,
    smtpPort: preset ? preset.smtpPort : settings.smtpPort,
    smtpSecure: preset ? preset.smtpSecure : settings.smtpSecure,
    imapHost: preset ? preset.imapHost : settings.imapHost,
    imapPort: preset ? preset.imapPort : settings.imapPort,
  }
}

const syncStore = new Store<{ lastUid: Record<string, number> }>({ name: 'sync', defaults: { lastUid: {} } })

function syncKey(settings: AppSettings): string {
  return `${settings.email.toLowerCase()}::${settings.recipientEmail.toLowerCase()}`
}

function accountEmail(settings: AppSettings): string {
  return (settings.oauthEmail || settings.email).trim()
}

function assertCredentials(settings: AppSettings) {
  if (settings.authMethod === 'oauth') {
    if (!settings.oauthRefreshToken?.trim()) {
      throw new Error('Email account is not connected. Go to Settings and click "Connect" to authorize your account.')
    }
  } else {
    if (!settings.email?.trim() || !settings.appPassword?.trim()) {
      throw new Error('Email account is not configured. Go to Settings, enter your email + password, and click "Save settings".')
    }
  }
}

/** Returns a fresh access token for OAuth providers, refreshing it if near expiry. */
async function ensureAccessToken(settings: AppSettings): Promise<string> {
  if (settings.authMethod !== 'oauth') throw new Error('OAuth is not enabled for this account.')
  if (!settings.oauthRefreshToken) throw new Error('No refresh token available. Reconnect your account.')

  const now = Date.now()
  if (settings.oauthAccessToken && settings.oauthTokenExpiry && settings.oauthTokenExpiry > now + 60_000) {
    return settings.oauthAccessToken
  }

  const creds = getProviderCredentials(settings.provider)
  const { accessToken, expiry } = await refreshAccessToken(
    settings.provider,
    creds.clientId,
    creds.clientSecret,
    settings.oauthRefreshToken,
  )
  saveSettings({ oauthAccessToken: accessToken, oauthTokenExpiry: expiry })
  return accessToken
}

function getSmtpAuth(settings: AppSettings, accessToken: string) {
  if (settings.authMethod === 'oauth') {
    return { type: 'OAuth2' as const, user: accountEmail(settings), accessToken }
  }
  return { user: settings.email.trim(), pass: settings.appPassword.trim() }
}

function getImapAuth(settings: AppSettings, accessToken: string) {
  if (settings.authMethod === 'oauth') {
    return { user: accountEmail(settings), accessToken }
  }
  return { user: settings.email.trim(), pass: settings.appPassword.trim() }
}

async function getTransporter(settings: AppSettings) {
  const accessToken = settings.authMethod === 'oauth' ? await ensureAccessToken(settings) : ''
  const { smtpHost, smtpPort, smtpSecure } = resolveConnectionParams(settings)
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: getSmtpAuth(settings, accessToken),
  })
}

/** Turns raw SMTP/IMAP auth failures into an actionable message instead of the raw protocol error. */
function friendlyMailError(e: any, settings: AppSettings): string {
  const raw = e?.message ?? 'unknown error'
  const code = e?.responseCode ?? e?.code
  const isAuthFailure =
    code === 530 || code === 535 || code === 'EAUTH' || /auth(entication)? (required|failed)/i.test(raw)
  if (isAuthFailure) {
    return settings.authMethod === 'oauth'
      ? 'Authentication failed. Your Google/Microsoft/Yahoo authorization may have expired or been revoked — go to Settings and click "Connect" again.'
      : 'Authentication failed. Check your email/password in Settings (Gmail and most providers require an app-specific password, not your regular login password).'
  }
  return raw
}

export async function sendFiles(settings: AppSettings, filePaths: string[]): Promise<SendFilesResult> {
  assertCredentials(settings)
  if (!settings.recipientEmail) {
    throw new Error('Recipient email is not set. Go to Settings and enter a recipient email.')
  }

  const transporter = await getTransporter(settings)
  const from = accountEmail(settings)
  const results: SendFilesResult['results'] = []
  let sent = 0
  let failed = 0

  // Throttle between sends to stay within provider rate limits and avoid spam filtering.
  const delayMs = Math.max(0, Number(settings.sendDelayMs) || 0)

  for (let i = 0; i < filePaths.length; i++) {
    if (i > 0 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    const filePath = filePaths[i]
    const fileName = path.basename(filePath)
    try {
      await fs.access(filePath)
      await transporter.sendMail({
        from,
        to: settings.recipientEmail.trim(),
        // A non-empty subject reduces the chance of being flagged as spam.
        subject: settings.emailSubject?.trim() || fileName,
        text: '',
        attachments: [{ filename: fileName, path: filePath }],
      })
      sent += 1
      results.push({ name: fileName, ok: true })
      addLog({ action: 'SEND_FILE', fileName, recipient: settings.recipientEmail, status: 'SUCCESS', message: `Sent to ${settings.recipientEmail}` })
    } catch (e: any) {
      failed += 1
      const message = friendlyMailError(e, settings)
      results.push({ name: fileName, ok: false, error: message })
      addLog({ action: 'SEND_FILE', fileName, recipient: settings.recipientEmail, status: 'FAILED', message })
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

  const accessToken = settings.authMethod === 'oauth' ? await ensureAccessToken(settings) : ''
  const { imapHost, imapPort } = resolveConnectionParams(settings)
  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: getImapAuth(settings, accessToken),
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
    const transporter = await getTransporter(settings)
    await transporter.verify()
    out.smtp = true
  } catch (e: any) {
    out.error = `SMTP: ${friendlyMailError(e, settings)}`
  }
  try {
    const accessToken = settings.authMethod === 'oauth' ? await ensureAccessToken(settings) : ''
    const { imapHost, imapPort } = resolveConnectionParams(settings)
    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: true,
      auth: getImapAuth(settings, accessToken),
      logger: false,
    })
    await client.connect()
    await client.logout()
    out.imap = true
  } catch (e: any) {
    out.error = `${out.error ? out.error + ' | ' : ''}IMAP: ${friendlyMailError(e, settings)}`
  }
  return out
}
