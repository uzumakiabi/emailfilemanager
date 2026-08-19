import { google } from 'googleapis'
import { prisma } from './db'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'openid',
  'email',
  'profile',
]

export function getOAuthClient() {
  if (!googleConfigured()) return null
  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const baseUrl = process.env.NEXTAUTH_URL!
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/google/callback`
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function googleConfigured(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID ?? ''
  const secret = process.env.GOOGLE_CLIENT_SECRET ?? ''
  const url = process.env.NEXTAUTH_URL ?? ''
  const isPlaceholder = (v: string) => !v || v.startsWith('REPLACE_WITH_')
  return !isPlaceholder(id) && !isPlaceholder(secret) && Boolean(url)
}

export async function getAuthorizedClient(userId: string) {
  const oauth2 = getOAuthClient()
  if (!oauth2) return { oauth2: null, account: null, error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' as string | null }
  const account = await prisma.googleAccount.findUnique({ where: { userId } })
  if (!account?.refreshToken) {
    return { oauth2: null, account: null, error: 'Google account is not connected. Click "Connect Google" to authorize.' }
  }
  oauth2.setCredentials({
    access_token: account.accessToken ?? undefined,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpiry ? account.tokenExpiry.getTime() : undefined,
  })

  // Refresh if expired
  try {
    const needsRefresh = !account.tokenExpiry || account.tokenExpiry.getTime() < Date.now() + 60_000
    if (needsRefresh) {
      const { credentials } = await oauth2.refreshAccessToken()
      await prisma.googleAccount.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token ?? account.accessToken,
          tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : account.tokenExpiry,
        },
      })
      oauth2.setCredentials(credentials)
    }
  } catch (e: any) {
    return { oauth2: null, account: null, error: `Failed to refresh Google access token: ${e?.message ?? 'unknown error'}` }
  }

  return { oauth2, account, error: null }
}

export async function findOrCreateFolder(drive: any, folderName: string): Promise<{ id: string | null; error?: string }> {
  const name = (folderName ?? '').trim()
  if (!name) return { id: null, error: 'Source folder name is empty. Set it in Settings.' }
  try {
    // Search the authenticated user's own My Drive (spaces: 'drive') for a folder
    // with this exact name. Prefer one at the Drive root so we don't pick up a
    // same-named folder that was shared with the user from another account.
    const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and trashed = false`
    const res = await drive.files.list({ q, fields: 'files(id, name, parents)', pageSize: 50, spaces: 'drive' })
    const files = res?.data?.files ?? []
    const root = files.find((f: any) => !f?.parents || f.parents.length === 0 || f.parents.includes('root'))
    const existing = root?.id ?? files[0]?.id
    if (existing) return { id: existing }
    const created = await drive.files.create({
      requestBody: { name, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    return { id: created?.data?.id ?? null }
  } catch (e: any) {
    const msg = e?.message ?? String(e)
    // Surface the common "API not enabled" case so the user knows to enable it
    // in Google Cloud Console instead of a confusing "folder not found".
    if (/has not been used in project|is disabled|accessNotConfigured/i.test(msg)) {
      return { id: null, error: 'Google Drive API is not enabled for this app. Enable the "Google Drive API" (and "Gmail API") in Google Cloud Console, then try again.' }
    }
    console.error('findOrCreateFolder error:', msg)
    return { id: null, error: `Could not access the "${name}" folder: ${msg}` }
  }
}
