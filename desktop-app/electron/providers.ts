export type ProviderId = 'gmail' | 'outlook' | 'yahoo' | 'custom'

export interface ProviderPreset {
  id: ProviderId
  label: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  imapHost: string
  imapPort: number
  helpUrl: string
  helpText: string
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
    helpUrl: 'https://myaccount.google.com/apppasswords',
    helpText: 'Enable 2-Step Verification, then create an App Password at myaccount.google.com/apppasswords and use it here (not your normal password).',
  },
  outlook: {
    id: 'outlook',
    label: 'Outlook / Microsoft 365',
    smtpHost: 'smtp-mail.outlook.com',
    smtpPort: 587,
    smtpSecure: false,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    helpUrl: 'https://account.live.com/proofs/AppPassword',
    helpText: 'Enable 2-Step Verification, then create an App Password at account.live.com/proofs/AppPassword and use it here.',
  },
  yahoo: {
    id: 'yahoo',
    label: 'Yahoo Mail',
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    smtpSecure: true,
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    helpUrl: 'https://login.yahoo.com/account/security',
    helpText: 'Enable 2-Step Verification, then generate an App Password in your Yahoo Account Security page and use it here.',
  },
  custom: {
    id: 'custom',
    label: 'Other (custom SMTP/IMAP)',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    imapHost: '',
    imapPort: 993,
    helpUrl: '',
    helpText: 'Enter the SMTP and IMAP host/port details provided by your email provider or IT admin.',
  },
}
