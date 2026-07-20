import SettingsClient from './settings-client'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'
import AppShell from '@/components/app-shell'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  let settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings) settings = await prisma.settings.create({ data: { userId } })

  return (
    <AppShell>
      <SettingsClient
        initialSettings={{
          sourceFolder: settings.sourceFolder,
          destinationFolder: settings.destinationFolder,
          recipientEmail: settings.recipientEmail,
        }}
      />
    </AppShell>
  )
}
