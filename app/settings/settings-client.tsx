'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Save, FolderOpen, FolderDown, AtSign, RotateCcw } from 'lucide-react'

type Settings = { sourceFolder: string; destinationFolder: string; recipientEmail: string }

const DEFAULTS: Settings = {
  sourceFolder: 'Plati',
  destinationFolder: 'ReturnedPlati',
  recipientEmail: 'celaplata@ujp.gov.mk',
}

export default function SettingsClient({ initialSettings }: { initialSettings: Settings }) {
  const [sourceFolder, setSourceFolder] = useState(initialSettings.sourceFolder)
  const [destinationFolder, setDestinationFolder] = useState(initialSettings.destinationFolder)
  const [recipientEmail, setRecipientEmail] = useState(initialSettings.recipientEmail)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceFolder: sourceFolder.trim(), destinationFolder: destinationFolder.trim(), recipientEmail: recipientEmail.trim() }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast.error(d?.error ?? 'Failed to save')
        return
      }
      toast.success('Settings saved')
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const resetDefaults = () => {
    setSourceFolder(DEFAULTS.sourceFolder)
    setDestinationFolder(DEFAULTS.destinationFolder)
    setRecipientEmail(DEFAULTS.recipientEmail)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure folder paths and the recipient email for this workflow.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow configuration</CardTitle>
          <CardDescription>Folders are located in Google Drive by name. They will be created if they don&apos;t exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <Field
              id="sourceFolder"
              label="Source folder (Drive)"
              help="Files in this folder are sent one-by-one as email attachments. Default: Plati"
              icon={<FolderOpen className="w-4 h-4" />}
              value={sourceFolder}
              onChange={setSourceFolder}
              placeholder="Plati"
            />
            <Field
              id="destinationFolder"
              label="Destination folder (Drive)"
              help="Attachments from received emails are saved here. Default: ReturnedPlati"
              icon={<FolderDown className="w-4 h-4" />}
              value={destinationFolder}
              onChange={setDestinationFolder}
              placeholder="ReturnedPlati"
            />
            <Field
              id="recipientEmail"
              label="Recipient / sender email"
              help="Files are sent to this address, and responses are collected from it."
              icon={<AtSign className="w-4 h-4" />}
              value={recipientEmail}
              onChange={setRecipientEmail}
              placeholder="celaplata@ujp.gov.mk"
              type="email"
            />
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save settings
              </Button>
              <Button type="button" variant="outline" onClick={resetDefaults} disabled={saving}>
                <RotateCcw className="w-4 h-4" /> Reset to defaults
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ id, label, help, icon, value, onChange, placeholder, type = 'text' }: {
  id: string; label: string; help?: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-10" />
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  )
}
