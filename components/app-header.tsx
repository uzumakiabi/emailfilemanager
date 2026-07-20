'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Mail, LayoutDashboard, Settings as SettingsIcon, LogOut, FolderSync } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AppHeader({ userEmail, userName }: { userEmail: string; userName: string | null }) {
  const pathname = usePathname()
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ]
  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-border">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-display font-semibold text-base tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderSync className="w-4 h-4 text-primary" />
          </div>
          Email File Manager
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((it) => {
            const active = pathname === it.href
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground px-2">
            <Mail className="w-4 h-4" />
            <span className="max-w-[180px] truncate">{userName ?? userEmail}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
      <nav className="md:hidden mx-auto w-full max-w-[1200px] px-4 pb-2 flex items-center gap-1">
        {navItems.map((it) => {
          const active = pathname === it.href
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <it.icon className="w-4 h-4" />
              {it.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
