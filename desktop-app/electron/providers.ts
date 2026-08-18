export type ProviderId = 'gmail' | 'outlook' | 'yahoo' | 'custom'

export interface ProviderPreset {
  id: ProviderId
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

export const PROVIDER_PRESETS: Record<ProviderId, ProviderPreset> = {
  gmail: {
    id: 'gmail',
    label: 'Gmail',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    supportsOAuth: true,
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    helpText: 'Create a Google OAuth Client ID (type: Desktop app) in the Google Cloud Console, then click "Connect with Google". No app password or 2-Step Verification needed.',
    dailyLimit: 500,
    recommendedDelayMs: 2000,
  },
  outlook: {
    id: 'outlook',
    label: 'Outlook / Microsoft 365',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    supportsOAuth: true,
    helpUrl: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    helpText: 'Register an app in the Azure portal, add the SMTP.Send and IMAP.AccessAsUser.All permissions, then click "Connect with Microsoft". No app password needed.',
    dailyLimit: 300,
    recommendedDelayMs: 2000,
  },
  yahoo: {
    id: 'yahoo',
    label: 'Yahoo Mail',
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    smtpSecure: true,
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    supportsOAuth: true,
    helpUrl: 'https://developer.yahoo.com/apps/create/',
    helpText: 'Create a Yahoo app in the Yahoo Developer Network, then click "Connect with Yahoo". No app password needed.',
    dailyLimit: 500,
    recommendedDelayMs: 2000,
  },
  custom: {
    id: 'custom',
    label: 'Other (custom SMTP/IMAP)',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    imapHost: '',
    imapPort: 993,
    supportsOAuth: false,
    helpUrl: '',
    helpText: 'Enter the SMTP and IMAP host/port details and your account password provided by your email provider or IT admin.',
    dailyLimit: null,
    recommendedDelayMs: 2000,
  },
}
