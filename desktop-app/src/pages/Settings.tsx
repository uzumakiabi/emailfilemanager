import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save, FolderDown, AtSign, MailCheck, Gauge, ShieldCheck, Link2, Unlink, KeyRound } from 'lucide-react'
import type { AppSettings, ProviderPreset } from '@/electron-api'
import { useI18n } from '@/lib/i18n'

export default function SettingsPage() {
  const { t } = useI18n()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [presets, setPresets] = useState<Record<string, ProviderPreset>>({})
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    window.api.getSettings().then(setSettings)
    window.api.getProviderPresets().then(setPresets)
  }, [])

  if (!settings) {
    return <div className="py-12 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
  }

  const preset = presets[settings.provider]

  const update = (patch: Partial<AppSettings>) => setSettings((s) => (s ? { ...s, ...patch } : s))

  const onProviderChange = (provider: string) => {
    const p = presets[provider]
    if (!p) return
    update({
      provider: provider as AppSettings['provider'],
      authMethod: p.supportsOAuth ? 'oauth' : 'password',
      smtpHost: p.smtpHost,
      smtpPort: p.smtpPort,
      smtpSecure: p.smtpSecure,
      imapHost: p.imapHost,
      imapPort: p.imapPort,
    })
  }

  const handleConnect = async () => {
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

  const handleDisconnect = async () => {
    try {
      const res = await window.api.disconnectOAuth()
      setSettings(res)
      toast.success(t('settings.oauth.disconnected'))
    } catch {
      toast.error(t('settings.oauth.disconnectFailed'))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await window.api.saveSettings(settings)
      toast.success(t('settings.saved'))
    } catch {
      toast.error(t('settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

const pickDownloadFolder = async () => {
    const folder = await window.api.pickFolder()
    if (folder) update({ downloadFolder: folder })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><MailCheck className="w-5 h-5" /></div>
            <div>
              <CardTitle>{t('settings.account.title')}</CardTitle>
              <CardDescription>{t('settings.account.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('settings.account.provider')}</Label>
            <Select value={settings.provider} onValueChange={onProviderChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(presets).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{t(`provider.${p.id}.label`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset?.supportsOAuth ? (
            <>
              <div className={`rounded-md border p-3 text-sm flex items-center gap-2 ${settings.oauthRefreshToken ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                {settings.oauthRefreshToken ? <MailCheck className="w-4 h-4 shrink-0" /> : <Link2 className="w-4 h-4 shrink-0" />}
                <span className="flex-1">
                  {settings.oauthRefreshToken
                    ? t('settings.oauth.connectedAs', { email: settings.oauthEmail || settings.email })
                    : t('settings.oauth.notConnected')}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {settings.oauthRefreshToken ? (
                  <>
                    <Button size="sm" onClick={handleConnect} disabled={connecting}>
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      {t('settings.oauth.switchAccount')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDisconnect}>
                      <Unlink className="w-4 h-4" /> {t('settings.oauth.disconnect')}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleConnect} disabled={connecting}>
                    {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    {t('settings.oauth.connect', { provider: t(`provider.${settings.provider}.label`) })}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('settings.account.email')}</Label>
                  <Input value={settings.email} onChange={(e) => update({ email: e.target.value })} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('settings.account.appPassword')}</Label>
                  <Input type="password" value={settings.appPassword} onChange={(e) => update({ appPassword: e.target.value })} placeholder={t('settings.account.appPasswordPlaceholder')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('settings.account.smtpHost')}</Label>
                  <Input value={settings.smtpHost} onChange={(e) => update({ smtpHost: e.target.value })} placeholder="smtp.yourprovider.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('settings.account.smtpPort')}</Label>
                  <Input type="number" value={settings.smtpPort} onChange={(e) => update({ smtpPort: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('settings.account.imapHost')}</Label>
                  <Input value={settings.imapHost} onChange={(e) => update({ imapHost: e.target.value })} placeholder="imap.yourprovider.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('settings.account.imapPort')}</Label>
                  <Input type="number" value={settings.imapPort} onChange={(e) => update({ imapPort: Number(e.target.value) })} />
                </div>
              </div>
            </>
          )}

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><AtSign className="w-5 h-5" /></div>
            <div>
              <CardTitle>{t('settings.recipient.title')}</CardTitle>
              <CardDescription>{t('settings.recipient.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('settings.recipient.email')}</Label>
            <Input value={settings.recipientEmail} onChange={(e) => update({ recipientEmail: e.target.value })} placeholder="recipient@example.com" />
            <p className="text-xs text-muted-foreground">{t('settings.recipient.emailNote')}</p>
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.recipient.downloadFolder')}</Label>
            <div className="flex gap-2">
              <Input value={settings.downloadFolder} readOnly placeholder={t('settings.recipient.chooseFolder')} />
              <Button variant="outline" onClick={pickDownloadFolder}><FolderDown className="w-4 h-4" /> {t('common.browse')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center"><Gauge className="w-5 h-5" /></div>
            <div>
              <CardTitle>{t('settings.limits.title')}</CardTitle>
              <CardDescription>{t('settings.limits.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('settings.limits.delay')}</Label>
              <Input type="number" min={0} step={500} value={settings.sendDelayMs} onChange={(e) => update({ sendDelayMs: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">{t('settings.limits.delayNote')}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.limits.subject')}</Label>
              <Input value={settings.emailSubject} onChange={(e) => update({ emailSubject: e.target.value })} placeholder={t('settings.limits.subjectNote')} />
            </div>
          </div>

          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
            <div className="font-medium">{t('settings.limits.providerLimit')}: {preset?.dailyLimit ? `${preset.dailyLimit} / day` : t('settings.limits.providerLimitUnknown')}</div>
            <p className="mt-1">{t('settings.limits.warning')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <CardTitle>{t('settings.privacy.title')}</CardTitle>
              <CardDescription>{t('settings.privacy.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />{t('settings.privacy.localFiles')}</p>
          <p className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />{t('settings.privacy.localSettings')}</p>
          <p className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />{t('settings.privacy.direct')}</p>
          <p className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />{t('settings.privacy.gdpr')}</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  )
}
