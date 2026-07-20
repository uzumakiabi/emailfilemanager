'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Send, Inbox, Link2, Unlink, CheckCircle2, XCircle, Loader2, RefreshCcw,
  FolderOpen, FolderDown, AtSign, FileText, Activity, Trash2, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Settings = { sourceFolder: string; destinationFolder: string; recipientEmail: string }
type GoogleStatus = { configured: boolean; connected: boolean; googleEmail: string | null }
type ActivityLog = {
  id: string
  action: string
  fileName: string | null
  recipient: string | null
  sender: string | null
  status: string
  message: string | null
  createdAt: string
}

export default function DashboardClient({ initialSettings, googleStatus: initialStatus }: { initialSettings: Settings; googleStatus: GoogleStatus }) {
  const [settings] = useState<Settings>(initialSettings)
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>(initialStatus)
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [statusText, setStatusText] = useState<string>('')
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const refreshStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/google/status', { cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setGoogleStatus({ configured: Boolean(d?.configured), connected: Boolean(d?.connected), googleEmail: d?.googleEmail ?? null })
    } catch {}
  }, [])

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const r = await fetch('/api/activity?take=100', { cache: 'no-store' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setLogs(Array.isArray(d?.logs) ? d.logs : [])
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshLogs()
  }, [refreshLogs])

  // Handle OAuth redirect feedback
  useEffect(() => {
    const googleParam = searchParams?.get?.('google')
    if (googleParam === 'connected') {
      toast.success('Google account connected')
      refreshStatus()
      router.replace('/dashboard')
    } else if (googleParam === 'error') {
      const msg = searchParams?.get?.('msg') ?? 'Authorization failed'
      toast.error(`Google connection error: ${msg}`)
      router.replace('/dashboard')
    }
  }, [searchParams, router, refreshStatus])

  const connectGoogle = async () => {
    setConnecting(true)
    try {
      const r = await fetch('/api/google/connect')
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.url) {
        toast.error(d?.error ?? 'Could not start Google sign-in')
        return
      }
      window.location.href = d.url
    } catch {
      toast.error('Network error')
    } finally {
      setConnecting(false)
    }
  }

  const disconnectGoogle = async () => {
    try {
      const r = await fetch('/api/google/disconnect', { method: 'POST' })
      if (r.ok) {
        toast.success('Google disconnected')
        refreshStatus()
      }
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  const handleSend = async () => {
    if (!googleStatus.connected) {
      toast.error('Connect your Google account first')
      return
    }
    setSending(true)
    setStatusText(`Reading files from “${settings.sourceFolder}”…`)
    try {
      const r = await fetch('/api/send-files', { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast.error(d?.error ?? 'Send failed')
        setStatusText('')
        return
      }
      if ((d?.total ?? 0) === 0) {
        toast.info(`No files found in “${settings.sourceFolder}”`)
      } else {
        toast.success(`Sent ${d?.sent ?? 0} of ${d?.total ?? 0} file(s)${d?.failed ? `, ${d.failed} failed` : ''}`)
      }
      setStatusText(`Done. Sent ${d?.sent ?? 0} · Failed ${d?.failed ?? 0}`)
      refreshLogs()
    } catch (e: any) {
      toast.error(e?.message ?? 'Network error')
      setStatusText('')
    } finally {
      setSending(false)
    }
  }

  const handleCheck = async () => {
    if (!googleStatus.connected) {
      toast.error('Connect your Google account first')
      return
    }
    setChecking(true)
    setStatusText(`Checking Gmail for new responses from ${settings.recipientEmail}…`)
    try {
      const r = await fetch('/api/check-responses', { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast.error(d?.error ?? 'Check failed')
        setStatusText('')
        return
      }
      if ((d?.messages ?? 0) === 0) {
        toast.info('No new emails to process')
      } else {
        toast.success(`Processed ${d?.messages ?? 0} email(s), downloaded ${d?.downloaded ?? 0} attachment(s)`)
      }
      setStatusText(`Done. Emails ${d?.messages ?? 0} · Downloaded ${d?.downloaded ?? 0} · Failed ${d?.failed ?? 0}`)
      refreshLogs()
    } catch (e: any) {
      toast.error(e?.message ?? 'Network error')
      setStatusText('')
    } finally {
      setChecking(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('Clear all activity logs?')) return
    try {
      const r = await fetch('/api/activity', { method: 'DELETE' })
      if (r.ok) {
        toast.success('Activity log cleared')
        refreshLogs()
      }
    } catch {}
  }

  const busy = sending || checking

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Send Drive files and collect Gmail responses in one place.</p>
      </div>

      {/* Google connection card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', googleStatus.connected ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
                {googleStatus.connected ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <CardTitle className="text-lg">Google account</CardTitle>
                <CardDescription>
                  {googleStatus.connected ? (
                    <>Connected as <span className="font-medium text-foreground">{googleStatus.googleEmail ?? 'Google user'}</span></>
                  ) : googleStatus.configured ? (
                    'Authorize Gmail and Drive access to start.'
                  ) : (
                    'Google OAuth is not configured on the server yet.'
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleStatus.connected ? (
                <Button variant="outline" size="sm" onClick={disconnectGoogle}>
                  <Unlink className="w-4 h-4" /> Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={connectGoogle} disabled={connecting || !googleStatus.configured}>
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Connect Google
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {!googleStatus.configured && (
          <CardContent>
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-sm text-amber-900 dark:text-amber-200">
              Ask an administrator to set <code className="font-mono">GOOGLE_CLIENT_ID</code> and <code className="font-mono">GOOGLE_CLIENT_SECRET</code> in the project environment. Once set, Connect Google will be enabled.
            </div>
          </CardContent>
        )}
      </Card>

      {/* Config summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard icon={<FolderOpen className="w-5 h-5" />} label="Source folder (Drive)" value={settings.sourceFolder} />
        <InfoCard icon={<FolderDown className="w-5 h-5" />} label="Destination folder (Drive)" value={settings.destinationFolder} />
        <InfoCard icon={<AtSign className="w-5 h-5" />} label="Recipient email" value={settings.recipientEmail} />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="interactive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Send className="w-5 h-5" /></div>
              <div>
                <CardTitle>Send Files</CardTitle>
                <CardDescription>Send every file in “{settings.sourceFolder}” as an attachment to {settings.recipientEmail}.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={handleSend} disabled={busy || !googleStatus.connected}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send Files'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">No subject, no body. Files remain in the source folder.</p>
          </CardContent>
        </Card>
        <Card variant="interactive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Inbox className="w-5 h-5" /></div>
              <div>
                <CardTitle>Check for Responses</CardTitle>
                <CardDescription>Download attachments from new emails sent by {settings.recipientEmail} into “{settings.destinationFolder}”.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" variant="secondary" onClick={handleCheck} disabled={busy || !googleStatus.connected}>
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Inbox className="w-4 h-4" />}
              {checking ? 'Checking…' : 'Check for Responses'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Processed messages are labeled so they won’t be downloaded again.</p>
          </CardContent>
        </Card>
      </div>

      {statusText && (
        <div className="rounded-md bg-primary/5 border border-primary/10 text-primary-foreground px-4 py-3 text-sm flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span className="text-foreground">{statusText}</span>
        </div>
      )}

      {/* Activity log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center"><Activity className="w-5 h-5" /></div>
              <div>
                <CardTitle>Activity log</CardTitle>
                <CardDescription>Last 100 sent and received items</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshLogs} disabled={logsLoading}>
                {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityList logs={logs} loading={logsLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium truncate" title={value}>{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityList({ logs, loading }: { logs: ActivityLog[]; loading: boolean }) {
  if (loading && logs.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
  }
  if (logs.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">No activity yet. Click “Send Files” or “Check for Responses” to get started.</div>
  }
  return (
    <ul className="divide-y">
      {logs.map((log) => {
        const ok = log.status === 'SUCCESS'
        const isSend = log.action === 'SEND_FILE'
        const isRecv = log.action === 'RECEIVE_FILE'
        const accent = isSend ? 'bg-primary/10 text-primary' : isRecv ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'
        const Icon = isSend ? Send : isRecv ? Inbox : Activity
        return (
          <li key={log.id} className="py-3 flex items-start gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', accent)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{log.fileName ?? (isSend ? 'File' : isRecv ? 'Message' : log.action)}</span>
                <Badge variant={ok ? 'default' : 'destructive'} className={ok ? 'bg-emerald-500 hover:bg-emerald-500' : undefined}>
                  {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {log.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {isSend ? `→ ${log.recipient ?? ''}` : isRecv ? `← ${log.sender ?? ''}` : ''}
                </span>
              </div>
              {log.message && <div className="text-xs text-muted-foreground mt-0.5 truncate">{log.message}</div>}
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
