import Store from 'electron-store'
import { randomUUID } from 'crypto'
import type { AppSettings, ActivityLogEntry } from './types'
import { PROVIDER_PRESETS } from './providers'

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  provider: 'gmail',
  email: '',
  appPassword: '',
  smtpHost: PROVIDER_PRESETS.gmail.smtpHost,
  smtpPort: PROVIDER_PRESETS.gmail.smtpPort,
  smtpSecure: PROVIDER_PRESETS.gmail.smtpSecure,
  imapHost: PROVIDER_PRESETS.gmail.imapHost,
  imapPort: PROVIDER_PRESETS.gmail.imapPort,
  recipientEmail: '',
  downloadFolder: '',
}

interface StoreSchema {
  settings: AppSettings
  logs: ActivityLogEntry[]
}

const store = new Store<StoreSchema>({
  defaults: {
    settings: DEFAULT_SETTINGS,
    logs: [],
  },
  // Encrypts values at rest on disk (basic obfuscation, not a full secrets vault).
  encryptionKey: 'efm-desktop-local-store',
})

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...(store.get('settings') as Partial<AppSettings>) }
}

export function saveSettings(next: Partial<AppSettings>): AppSettings {
  const merged = { ...getSettings(), ...next }
  store.set('settings', merged)
  return merged
}

export function getLogs(take = 100): ActivityLogEntry[] {
  const logs = (store.get('logs') as ActivityLogEntry[]) ?? []
  return logs.slice(0, take)
}

export function addLog(entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>): ActivityLogEntry {
  const full: ActivityLogEntry = { ...entry, id: randomUUID(), createdAt: new Date().toISOString() }
  const logs = (store.get('logs') as ActivityLogEntry[]) ?? []
  logs.unshift(full)
  store.set('logs', logs.slice(0, 500))
  return full
}

export function clearLogs(): void {
  store.set('logs', [])
}
