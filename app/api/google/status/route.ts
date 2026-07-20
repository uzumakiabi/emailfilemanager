import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'
import { googleConfigured } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await prisma.googleAccount.findUnique({ where: { userId } })
  return NextResponse.json({
    configured: googleConfigured(),
    connected: Boolean(account?.refreshToken),
    googleEmail: account?.googleEmail ?? null,
  })
}
