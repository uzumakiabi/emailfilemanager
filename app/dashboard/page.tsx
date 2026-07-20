import DashboardClient from './dashboard-client'
import { prisma } from '@/lib/db'
import { getCurrentUserId } from '@/lib/session-helpers'
import { googleConfigured } from '@/lib/google'
import AppShell from '@/components/app-shell'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  let settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings) settings = await prisma.settings.create({ data: { userId } })
  const googleAccount = await prisma.googleAccount.findUnique({ where: { userId } })

  return (
    <AppShell>
      <DashboardClient
        initialSettings={{
          sourceFolder: settings.sourceFolder,
          destinationFolder: settings.destinationFolder,
          recipientEmail: settings.recipientEmail,
        }}
        googleStatus={{
          configured: googleConfigured(),
          connected: Boolean(googleAccount?.refreshToken),
          googleEmail: googleAccount?.googleEmail ?? null,
        }}
      />
    </AppShell>
  )
}
