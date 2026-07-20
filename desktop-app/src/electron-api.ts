export interface AppSettings {
  language: 'en' | 'mk'
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom'
  email: string
  appPassword: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  imapHost: string
  imapPort: number
  recipientEmail: string
  downloadFolder: string
}

export interface ProviderPreset {
  id: string
  label: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  imapHost: string
  imapPort: number
  helpUrl: string
  helpText: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  fileName?: string | null
  recipient?: string | null
  sender?: string | null
  status: 'SUCCESS' | 'FAILED'
  message?: string | null
  createdAt: string
}

export interface ElectronApi {
  getSettings: () => Promise<AppSettings>
  saveSettings: (next: Partial<AppSettings>) => Promise<AppSettings>
  getProviderPresets: () => Promise<Record<string, ProviderPreset>>
  getLogs: (take?: number) => Promise<ActivityLogEntry[]>
  clearLogs: () => Promise<void>
  pickFiles: () => Promise<string[]>
  pickFolder: () => Promise<string | null>
  sendFiles: (filePaths: string[]) => Promise<{ ok: boolean; data?: any; error?: string }>
  checkResponses: () => Promise<{ ok: boolean; data?: any; error?: string }>
  testConnection: (override?: Partial<AppSettings>) => Promise<{ smtp: boolean; imap: boolean; error?: string }>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
