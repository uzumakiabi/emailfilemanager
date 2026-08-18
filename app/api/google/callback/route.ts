import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getOAuthClient } from '@/lib/google'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'

export const dynamic = 'force-dynamic'

// Always redirect against the public app URL rather than req.url — behind a reverse
// proxy (e.g. Railway) req.url can resolve to the container's internal address
// (like http://localhost:8080/...) instead of the public domain.
function appUrl(path: string): URL {
  const base = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
  return new URL(path, base)
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.redirect(appUrl('/login'))
  }
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(appUrl(`/dashboard?google=error&msg=${encodeURIComponent(error)}`))
  }
  if (!code) {
    return NextResponse.redirect(appUrl('/dashboard?google=error&msg=missing_code'))
  }

  const oauth2 = getOAuthClient()
  if (!oauth2) {
    return NextResponse.redirect(appUrl('/dashboard?google=error&msg=oauth_not_configured'))
  }

  try {
    const { tokens } = await oauth2.getToken(code)
    oauth2.setCredentials(tokens)

    // Get Google user info
    let googleEmail: string | null = null
    try {
      const oauth2api = google.oauth2({ auth: oauth2, version: 'v2' })
      const info = await oauth2api.userinfo.get()
      googleEmail = info?.data?.email ?? null
    } catch {}

    const data = {
      googleEmail,
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token ?? undefined,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: tokens.scope ?? null,
    }

    await prisma.googleAccount.upsert({
      where: { userId },
      create: {
        userId,
        googleEmail,
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: tokens.scope ?? null,
      },
      update: {
        googleEmail: data.googleEmail ?? undefined,
        accessToken: data.accessToken ?? undefined,
        ...(data.refreshToken ? { refreshToken: data.refreshToken } : {}),
        tokenExpiry: data.tokenExpiry ?? undefined,
        scopes: data.scopes ?? undefined,
      },
    })

    return NextResponse.redirect(appUrl('/dashboard?google=connected'))
  } catch (e: any) {
    return NextResponse.redirect(appUrl(`/dashboard?google=error&msg=${encodeURIComponent(e?.message ?? 'token_error')}`))
  }
}
