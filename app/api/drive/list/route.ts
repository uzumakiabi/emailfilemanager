import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAuthorizedClient, findOrCreateFolder } from '@/lib/google'
import { getCurrentUserId } from '@/lib/session-helpers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { oauth2, error } = await getAuthorizedClient(userId)
  if (!oauth2) return NextResponse.json({ error: error ?? 'Auth error' }, { status: 400 })

  const settings = await prisma.settings.findUnique({ where: { userId } })
  const sourceFolder = settings?.sourceFolder ?? 'Plati'

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2 })
    const folderId = await findOrCreateFolder(drive, sourceFolder)
    if (!folderId) return NextResponse.json({ error: `Folder "${sourceFolder}" not found` }, { status: 404 })

    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime)',
      pageSize: 1000,
      orderBy: 'name',
    })
    const files = res?.data?.files ?? []
    return NextResponse.json({ folder: sourceFolder, folderId, files })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Drive error' }, { status: 500 })
  }
}
