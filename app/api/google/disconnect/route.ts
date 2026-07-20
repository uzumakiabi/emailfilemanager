import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.googleAccount.deleteMany({ where: { userId } })
  return NextResponse.json({ ok: true })
}
