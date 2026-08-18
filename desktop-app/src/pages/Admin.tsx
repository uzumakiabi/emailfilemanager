import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, ShieldCheck, KeyRound, Save, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { AdminConfig, AppSettings } from '@/electron-api'

const PROVIDER_IDS: AppSettings['provider'][] = ['gmail', 'outlook', 'yahoo']

export default function AdminPage() {
  const { t } = useI18n()
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [creds, setCreds] = useState<Record<string, { clientId: string; clientSecret: string }>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.getAdminConfig().then((c) => {
      setConfig(c)
      setCreds(c.providers)
    })
  }, [])

  const handleSetPassword = async () => {
    if (!newPassword) return
    setBusy(true)
    setError('')
    const res = await window.api.setAdminPassword(newPassword)
    setBusy(false)
    if (res.ok) {
      setNewPassword('')
      const c = await window.api.getAdminConfig()
      setConfig(c)
      setUnlocked(true)
    } else {
      setError(res.error ?? '')
    }
  }

  const handleUnlock = async () => {
    setBusy(true)
    setError('')
    const res = await window.api.verifyAdminPassword(password)
    setBusy(false)
    if (res.ok) {
      setUnlocked(true)
      setPassword('')
    } else {
      setError(t('admin.wrongPassword'))
    }
  }

  const handleSave = async () => {
    setBusy(true)
    setError('')
    for (const id of PROVIDER_IDS) {
      const c = creds[id]
      if (c) {
        await window.api.setProviderCredentials(id, c.clientId, c.clientSecret)
      }
    }
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>{t('admin.title')}</CardTitle>
                <CardDescription>{t('admin.lockedDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.hasPassword ? (
              <>
                <div className="space-y-1.5">
                  <Label>{t('admin.password')}</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlock()} />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" onClick={handleUnlock} disabled={busy || !password}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {t('admin.unlock')}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t('admin.firstTime')}</p>
                <div className="space-y-1.5">
                  <Label>{t('admin.newPassword')}</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetPassword()} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button className="w-full" onClick={handleSetPassword} disabled={busy || !newPassword}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {t('admin.setPassword')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>{t('admin.title')}</CardTitle>
              <CardDescription>{t('admin.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {PROVIDER_IDS.map((id) => {
            const c = creds[id] ?? { clientId: '', clientSecret: '' }
            return (
              <div key={id} className="rounded-md border p-4 space-y-3">
                <div className="font-medium">{t(`provider.${id}.label`)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t('admin.clientId')}</Label>
                    <Input value={c.clientId} onChange={(e) => setCreds((prev) => ({ ...prev, [id]: { ...c, clientId: e.target.value } }))} placeholder="xxxxxxxx.apps.googleusercontent.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('admin.clientSecret')}</Label>
                    <Input type="password" value={c.clientSecret} onChange={(e) => setCreds((prev) => ({ ...prev, [id]: { ...c, clientSecret: e.target.value } }))} placeholder={t('admin.clientSecretPlaceholder')} />
                  </div>
                </div>
              </div>
            )
          })}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('common.save')}
            </Button>
            {saved && <span className="text-sm text-emerald-600">{t('admin.saved')}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
