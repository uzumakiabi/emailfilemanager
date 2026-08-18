'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Transient DOM reconciliation errors (e.g. triggered by a browser
    // extension mutating the page) usually clear up on a fresh render —
    // retry automatically once instead of showing a dead-end error screen.
    const isTransientDomError = /insertBefore|removeChild|NotFoundError/i.test(error?.message ?? '')
    if (isTransientDomError) {
      const key = 'wr_auto_retry_' + (error?.digest ?? 'transient')
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        reset()
      }
    }
  }, [error, reset])

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-display font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mt-1">
            An unexpected error occurred. You can try again or go back to the dashboard.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => reset()}>Try again</Button>
          <Button onClick={() => router.replace('/dashboard')}>Go to dashboard</Button>
        </div>
      </div>
    </div>
  )
}
