import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/session-helpers'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const userId = await getCurrentUserId()
  if (userId) redirect('/dashboard')
  redirect('/login')
}
