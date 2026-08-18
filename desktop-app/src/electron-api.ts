export type AuthMethod = 'oauth' | 'password'

export interface AppSettings {
  language: 'en' | 'mk'
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom'
  authMethod: AuthMethod
  email: string
  appPassword: string
  oauthAccessToken: string
  oauthRefreshToken: string
  oauthTokenExpiry: number | null
  oauthEmail: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  imapHost: string
  imapPort: number
  recipientEmail: string
  downloadFolder: string
  sendDelayMs: number
  emailSubject: string
}

export interface ProviderPreset {
  id: string
  label: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  imapHost: string
  imapPort: number
  supportsOAuth: boolean
  helpUrl: string
  helpText: string
  dailyLimit: number | null
  recommendedDelayMs: number
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
  startOAuth: (provider: AppSettings['provider']) => Promise<{ ok: boolean; data?: AppSettings; error?: string }>
  disconnectOAuth: () => Promise<AppSettings>

  getAdminConfig: () => Promise<AdminConfig>
  setAdminPassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  verifyAdminPassword: (password: string) => Promise<{ ok: boolean }>
  setProviderCredentials: (provider: AppSettings['provider'], clientId: string, clientSecret: string) => Promise<{ ok: boolean }>
}

export interface ProviderClientCredentials {
  clientId: string
  clientSecret: string
}

export interface AdminConfig {
  hasPassword: boolean
  providers: Record<string, ProviderClientCredentials>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
