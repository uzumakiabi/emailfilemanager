import { NextResponse } from 'next/server'
import { getOAuthClient, GOOGLE_SCOPES, googleConfigured } from '@/lib/google'
import { getCurrentUserId } from '@/lib/session-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!googleConfigured()) {
    return NextResponse.json({ error: 'Google OAuth is not configured on the server. Ask an administrator to set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' }, { status: 400 })
  }
  const oauth2 = getOAuthClient()
  if (!oauth2) return NextResponse.json({ error: 'Google OAuth client unavailable' }, { status: 500 })

  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    // Always show the Google account chooser, even if the browser already has an
    // active session for a different account — otherwise "Connect Google" silently
    // reuses whatever account is currently signed into the browser.
    prompt: 'select_account consent',
    scope: GOOGLE_SCOPES,
    state: userId,
    include_granted_scopes: true,
  })
  return NextResponse.json({ url })
}
