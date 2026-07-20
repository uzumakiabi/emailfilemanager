import AppHeader from '@/components/app-header'
import { getCurrentUserId } from '@/lib/session-helpers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <AppHeader userEmail={user?.email ?? ''} userName={user?.name ?? null} />
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  )
}
