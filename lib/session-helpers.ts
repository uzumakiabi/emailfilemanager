import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as any)?.id
  return id ?? null
}
