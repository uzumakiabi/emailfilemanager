import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Send, Inbox, CheckCircle2, XCircle, Loader2, RefreshCcw, FilePlus2, X,
  AtSign, FolderDown, Activity, Trash2, Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppSettings, ActivityLogEntry } from '@/electron-api'
import { useI18n } from '@/lib/i18n'

export default function Dashboard() {
  const { t } = useI18n()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [files, setFiles] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const data = await window.api.getLogs(100)
      setLogs(data ?? [])
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    window.api.getSettings().then(setSettings)
    refreshLogs()
  }, [refreshLogs])

  const pickFiles = async () => {
    const picked = await window.api.pickFiles()
    if (picked?.length) setFiles((prev) => [...new Set([...prev, ...picked])])
  }

  const removeFile = (path: string) => setFiles((prev) => prev.filter((f) => f !== path))

  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    if (!settings) return
    setConnecting(true)
    try {
      const res = await window.api.startOAuth(settings.provider)
      if (res.ok && res.data) {
        setSettings(res.data)
        toast.success(t('settings.oauth.connected'))
      } else {
        toast.error(res.error ?? t('settings.oauth.connectFailed'))
      }
    } catch {
      toast.error(t('settings.oauth.connectFailed'))
    } finally {
      setConnecting(false)
    }
  }

  const recipientLabel = settings?.recipientEmail || t('send.theRecipient')

  const handleSend = async () => {
    if (files.length === 0) {
      toast.error(t('send.pickFilesFirst'))
      return
    }
    setSending(true)
    setStatusText(t('send.progress', { count: files.length }))
    try {
      const res = await window.api.sendFiles(files)
      if (!res.ok) {
        toast.error(res.error ?? t('send.failed'))
        setStatusText('')
        return
      }
      const d = res.data
      const failedSuffix = d.failed ? t('send.failedSuffix', { failed: d.failed }) : ''
      toast.success(t('send.success', { sent: d.sent, total: d.total, failedSuffix }))
      setStatusText(t('send.done', { sent: d.sent, failed: d.failed }))
      setFiles([])
      refreshLogs()
    } catch (e: any) {
      toast.error(e?.message ?? t('send.unexpectedError'))
      setStatusText('')
    } finally {
      setSending(false)
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    setStatusText(t('check.progress', { recipient: recipientLabel }))
    try {
      const res = await window.api.checkResponses()
      if (!res.ok) {
        toast.error(res.error ?? t('check.failed'))
        setStatusText('')
        return
      }
      const d = res.data
      if (d.messages === 0) toast.info(t('check.noNew'))
      else toast.success(t('check.success', { messages: d.messages, downloaded: d.downloaded }))
      setStatusText(t('check.done', { messages: d.messages, downloaded: d.downloaded, failed: d.failed }))
      refreshLogs()
    } catch (e: any) {
      toast.error(e?.message ?? t('send.unexpectedError'))
      setStatusText('')
    } finally {
      setChecking(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm(t('activity.clearConfirm'))) return
    await window.api.clearLogs()
    toast.success(t('activity.cleared'))
    refreshLogs()
  }

  const busy = sending || checking

  if (!settings) return <div className="py-12 text-center text-sm text-muted-foreground">{t('common.loading')}</div>

  const accountConfigured =
    settings.authMethod === 'oauth'
      ? Boolean(settings.oauthRefreshToken)
      : Boolean(settings.email && settings.appPassword)
  const configured = Boolean(accountConfigured && settings.recipientEmail)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {!configured && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 flex items-center gap-3">
          <span className="flex-1">
            {settings.authMethod === 'oauth' && !settings.oauthRefreshToken
              ? t('dashboard.notConnectedOAuth', { provider: t(`provider.${settings.provider}.label`) })
              : t('dashboard.notConfigured', { settings: t('dashboard.settingsLink') })}
          </span>
          {settings.authMethod === 'oauth' && !settings.oauthRefreshToken && (
            <Button size="sm" onClick={handleConnect} disabled={connecting}>
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {t('settings.oauth.connect', { provider: t(`provider.${settings.provider}.label`) })}
            </Button>
          )}
        </div>
      )}

      {settings.authMethod === 'oauth' && settings.oauthRefreshToken && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900 flex items-center gap-3">
          <span className="flex-1">
            {t('settings.oauth.connectedAs', { email: settings.oauthEmail || settings.email })}
          </span>
          <Button size="sm" variant="outline" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {t('settings.oauth.switchAccount')}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={<AtSign className="w-5 h-5" />} label={t('dashboard.recipientEmail')} value={settings.recipientEmail || t('common.notSet')} />
        <InfoCard icon={<FolderDown className="w-5 h-5" />} label={t('dashboard.downloadFolder')} value={settings.downloadFolder || t('common.notSet')} />
      </div>

      <Card className="border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Send className="w-5 h-5" /></div>
            <div>
              <CardTitle>{t('send.title')}</CardTitle>
              <CardDescription>{t('send.description', { recipient: recipientLabel })}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={pickFiles} disabled={busy}>
            <FilePlus2 className="w-4 h-4" /> {t('send.chooseFiles')}
          </Button>

          {files.length > 0 && (
            <ul className="border rounded-md divide-y max-h-48 overflow-y-auto">
              {files.map((f) => (
                <li key={f} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate">{f.split(/[\\/]/).pop()}</span>
                  <button onClick={() => removeFile(f)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {files.length > 20 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              {t('send.largeBatchWarning', { count: files.length })}
            </div>
          )}

          <Button className="w-full" size="lg" onClick={handleSend} disabled={busy || files.length === 0 || !configured}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending
              ? t('send.sending')
              : files.length === 0
                ? t('send.button.none')
                : t(files.length === 1 ? 'send.button.one' : 'send.button.many', { count: files.length })}
          </Button>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Inbox className="w-5 h-5" /></div>
            <div>
              <CardTitle>{t('check.title')}</CardTitle>
              <CardDescription>{t('check.description', { recipient: recipientLabel })}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg" variant="secondary" onClick={handleCheck} disabled={busy || !configured}>
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Inbox className="w-4 h-4" />}
            {checking ? t('check.checking') : t('check.button')}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">{t('check.note')}</p>
        </CardContent>
      </Card>

      {statusText && (
        <div className="rounded-md bg-primary/5 border border-primary/10 px-4 py-3 text-sm flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{statusText}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center"><Activity className="w-5 h-5" /></div>
              <div>
                <CardTitle>{t('activity.title')}</CardTitle>
                <CardDescription>{t('activity.subtitle')}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshLogs} disabled={logsLoading}>
                {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                {t('activity.refresh')}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
                <Trash2 className="w-4 h-4" /> {t('activity.clear')}
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

function ActivityList({ logs, loading }: { logs: ActivityLogEntry[]; loading: boolean }) {
  const { t } = useI18n()
  if (loading && logs.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>
  }
  if (logs.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">{t('activity.empty')}</div>
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
                <span className="font-medium text-sm truncate">{log.fileName ?? (isSend ? t('activity.file') : isRecv ? t('activity.message') : log.action)}</span>
                <Badge variant={ok ? 'default' : 'destructive'} className={ok ? 'bg-emerald-500' : undefined}>
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
