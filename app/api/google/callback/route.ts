import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getOAuthClient } from '@/lib/google'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?google=error&msg=${encodeURIComponent(error)}`, req.url))
  }
  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?google=error&msg=missing_code', req.url))
  }

  const oauth2 = getOAuthClient()
  if (!oauth2) {
    return NextResponse.redirect(new URL('/dashboard?google=error&msg=oauth_not_configured', req.url))
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

    return NextResponse.redirect(new URL('/dashboard?google=connected', req.url))
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/dashboard?google=error&msg=${encodeURIComponent(e?.message ?? 'token_error')}`, req.url))
  }
}
