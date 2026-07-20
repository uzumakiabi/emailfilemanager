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

export async function findOrCreateFolder(drive: any, folderName: string): Promise<string | null> {
  try {
    const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`
    const res = await drive.files.list({ q, fields: 'files(id, name)', pageSize: 10, spaces: 'drive' })
    const existing = res?.data?.files?.[0]
    if (existing?.id) return existing.id
    const created = await drive.files.create({
      requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    return created?.data?.id ?? null
  } catch {
    return null
  }
}
