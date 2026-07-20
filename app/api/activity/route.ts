import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const take = Math.min(parseInt(searchParams.get('take') ?? '100', 10) || 100, 500)

  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
  })
  return NextResponse.json({ logs })
}

export async function DELETE() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.activityLog.deleteMany({ where: { userId } })
  return NextResponse.json({ ok: true })
}
