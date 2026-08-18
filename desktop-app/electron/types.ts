import type { ProviderId } from './providers'

export type AuthMethod = 'oauth' | 'password'

export interface AppSettings {
  language: 'en' | 'mk'
  provider: ProviderId
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

export interface ActivityLogEntry {
  id: string
  action: 'SEND_FILE' | 'RECEIVE_FILE' | 'ERROR' | 'INFO'
  fileName?: string | null
  recipient?: string | null
  sender?: string | null
  status: 'SUCCESS' | 'FAILED'
  message?: string | null
  createdAt: string
}

export interface SendFilesResult {
  sent: number
  failed: number
  total: number
  recipient: string
  results: Array<{ name: string; ok: boolean; error?: string }>
}

export interface CheckResponsesResult {
  messages: number
  downloaded: number
  failed: number
  results: Array<{ name: string; ok: boolean; error?: string }>
}
