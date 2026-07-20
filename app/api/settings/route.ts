import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings) {
    settings = await prisma.settings.create({ data: { userId } })
  }
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const sourceFolder = typeof body?.sourceFolder === 'string' ? body.sourceFolder.trim() : undefined
  const destinationFolder = typeof body?.destinationFolder === 'string' ? body.destinationFolder.trim() : undefined
  const recipientEmail = typeof body?.recipientEmail === 'string' ? body.recipientEmail.trim() : undefined

  if (sourceFolder === '' || destinationFolder === '' || recipientEmail === '') {
    return NextResponse.json({ error: 'Fields cannot be empty' }, { status: 400 })
  }

  const settings = await prisma.settings.upsert({
    where: { userId },
    create: {
      userId,
      sourceFolder: sourceFolder ?? 'Plati',
      destinationFolder: destinationFolder ?? 'ReturnedPlati',
      recipientEmail: recipientEmail ?? 'celaplata@ujp.gov.mk',
    },
    update: {
      ...(sourceFolder !== undefined ? { sourceFolder } : {}),
      ...(destinationFolder !== undefined ? { destinationFolder } : {}),
      ...(recipientEmail !== undefined ? { recipientEmail } : {}),
    },
  })
  return NextResponse.json({ settings })
}
