import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'en' | 'mk'

type Dict = Record<string, string>

const en: Dict = {
  'app.title': 'Email File Manager',
  'app.subtitle': 'Send files, collect responses',
  'nav.dashboard': 'Dashboard',
  'nav.settings': 'Settings',

  'common.loading': 'Loading…',
  'common.save': 'Save settings',
  'common.saving': 'Saving…',
  'common.browse': 'Browse',
  'common.open': 'Open',
  'common.notSet': '(not set)',

  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Send files one by one, then check for reply attachments.',
  'dashboard.notConfigured': 'Go to {settings} and fill in your email account, app password, and recipient email before sending or checking.',
  'dashboard.settingsLink': 'Settings',
  'dashboard.recipientEmail': 'Recipient email',
  'dashboard.downloadFolder': 'Download folder',

  'send.title': 'Send Files',
  'send.description': 'Pick files from your computer, then send each one individually (no subject/body) to {recipient}.',
  'send.chooseFiles': 'Choose files…',
  'send.sending': 'Sending…',
  'send.button.one': 'Send {count} File',
  'send.button.many': 'Send {count} Files',
  'send.button.none': 'Send Files',
  'send.theRecipient': 'the recipient',
  'send.pickFilesFirst': 'Pick at least one file first',
  'send.failed': 'Send failed',
  'send.unexpectedError': 'Unexpected error',
  'send.success': 'Sent {sent} of {total} file(s){failedSuffix}',
  'send.failedSuffix': ', {failed} failed',
  'send.done': 'Done. Sent {sent} · Failed {failed}',
  'send.progress': 'Sending {count} file(s) one by one…',

  'check.title': 'Check for Responses',
  'check.description': 'Download attachments from new emails sent by {recipient} into your download folder.',
  'check.button': 'Check for Responses',
  'check.checking': 'Checking…',
  'check.note': "Already-seen emails won't be downloaded again.",
  'check.failed': 'Check failed',
  'check.noNew': 'No new emails to process',
  'check.success': 'Processed {messages} email(s), downloaded {downloaded} attachment(s)',
  'check.done': 'Done. Emails {messages} · Downloaded {downloaded} · Failed {failed}',
  'check.progress': 'Checking inbox for new replies from {recipient}…',

  'activity.title': 'Activity log',
  'activity.subtitle': 'Last 100 sent and received items',
  'activity.refresh': 'Refresh',
  'activity.clear': 'Clear',
  'activity.clearConfirm': 'Clear all activity logs?',
  'activity.cleared': 'Activity log cleared',
  'activity.empty': 'No activity yet. Send files or check for responses to get started.',
  'activity.file': 'File',
  'activity.message': 'Message',

  'settings.title': 'Settings',
  'settings.subtitle': 'Configure your email account and the recipient for this workflow.',
  'settings.language': 'Language',

  'settings.account.title': 'Your email account',
  'settings.account.description': 'Used to send files and check for reply attachments. Works with Gmail, Outlook, Yahoo, or any custom IMAP/SMTP server.',
  'settings.account.provider': 'Provider',
  'settings.account.email': 'Your email address',
  'settings.account.appPassword': 'App password',
  'settings.account.appPasswordPlaceholder': 'App password (not your normal password)',
  'settings.account.smtpHost': 'SMTP host',
  'settings.account.smtpPort': 'SMTP port',
  'settings.account.imapHost': 'IMAP host',
  'settings.account.imapPort': 'IMAP port',
  'settings.account.testConnection': 'Test connection',
  'settings.account.testSuccess': 'Connection successful (SMTP + IMAP)',
  'settings.account.testFailed': 'Connection failed',

  'settings.recipient.title': 'Recipient & downloads',
  'settings.recipient.description': 'Where files are sent to, and where reply attachments are saved.',
  'settings.recipient.email': 'Recipient email',
  'settings.recipient.emailNote': 'Files are sent here, and this is also the address we check for reply attachments. Change it anytime.',
  'settings.recipient.downloadFolder': 'Download folder',
  'settings.recipient.chooseFolder': 'Choose a folder…',

  'settings.saved': 'Settings saved',
  'settings.saveFailed': 'Failed to save settings',

  'provider.gmail.label': 'Gmail',
  'provider.outlook.label': 'Outlook / Microsoft 365',
  'provider.yahoo.label': 'Yahoo Mail',
  'provider.custom.label': 'Other (custom SMTP/IMAP)',
  'provider.gmail.help': 'Enable 2-Step Verification, then create an App Password at myaccount.google.com/apppasswords and use it here (not your normal password).',
  'provider.outlook.help': 'Enable 2-Step Verification, then create an App Password at account.live.com/proofs/AppPassword and use it here.',
  'provider.yahoo.help': 'Enable 2-Step Verification, then generate an App Password in your Yahoo Account Security page and use it here.',
  'provider.custom.help': 'Enter the SMTP and IMAP host/port details provided by your email provider or IT admin.',
}

const mk: Dict = {
  'app.title': 'Управител на датотеки преку е-пошта',
  'app.subtitle': 'Испраќајте датотеки, собирајте одговори',
  'nav.dashboard': 'Контролна табла',
  'nav.settings': 'Поставки',

  'common.loading': 'Се вчитува…',
  'common.save': 'Зачувај поставки',
  'common.saving': 'Се зачувува…',
  'common.browse': 'Прегледај',
  'common.open': 'Отвори',
  'common.notSet': '(не е поставено)',

  'dashboard.title': 'Контролна табла',
  'dashboard.subtitle': 'Испраќајте датотеки една по една, потоа проверувајте за одговори со прилози.',
  'dashboard.notConfigured': 'Одете во {settings} и внесете ваша е-пошта, лозинка за апликација и е-пошта на примачот пред испраќање или проверка.',
  'dashboard.settingsLink': 'Поставки',
  'dashboard.recipientEmail': 'Е-пошта на примач',
  'dashboard.downloadFolder': 'Папка за преземање',

  'send.title': 'Испрати датотеки',
  'send.description': 'Изберете датотеки од вашиот компјутер, потоа испратете ги една по една (без наслов/текст) до {recipient}.',
  'send.chooseFiles': 'Избери датотеки…',
  'send.sending': 'Се испраќа…',
  'send.button.one': 'Испрати {count} датотека',
  'send.button.many': 'Испрати {count} датотеки',
  'send.button.none': 'Испрати датотеки',
  'send.theRecipient': 'примачот',
  'send.pickFilesFirst': 'Прво изберете најмалку една датотека',
  'send.failed': 'Испраќањето не успеа',
  'send.unexpectedError': 'Неочекувана грешка',
  'send.success': 'Испратени {sent} од {total} датотек(и){failedSuffix}',
  'send.failedSuffix': ', {failed} неуспешни',
  'send.done': 'Завршено. Испратени {sent} · Неуспешни {failed}',
  'send.progress': 'Испраќање на {count} датотек(и) една по една…',

  'check.title': 'Провери одговори',
  'check.description': 'Преземи прилози од нови е-пораки испратени од {recipient} во папката за преземање.',
  'check.button': 'Провери одговори',
  'check.checking': 'Се проверува…',
  'check.note': 'Веќе видените е-пораки не се преземаат повторно.',
  'check.failed': 'Проверката не успеа',
  'check.noNew': 'Нема нови е-пораки за обработка',
  'check.success': 'Обработени {messages} е-порак(и), преземени {downloaded} прилог(и)',
  'check.done': 'Завршено. Е-пораки {messages} · Преземени {downloaded} · Неуспешни {failed}',
  'check.progress': 'Проверка на сандачето за нови одговори од {recipient}…',

  'activity.title': 'Дневник на активности',
  'activity.subtitle': 'Последните 100 испратени и примени ставки',
  'activity.refresh': 'Обнови',
  'activity.clear': 'Избриши',
  'activity.clearConfirm': 'Да се избришат сите дневници на активности?',
  'activity.cleared': 'Дневникот на активности е избришан',
  'activity.empty': 'Нема активности сеуште. Испратете датотеки или проверете одговори за да започнете.',
  'activity.file': 'Датотека',
  'activity.message': 'Порака',

  'settings.title': 'Поставки',
  'settings.subtitle': 'Конфигурирајте ваша е-пошта сметка и примачот за овој процес.',
  'settings.language': 'Јазик',

  'settings.account.title': 'Ваша е-пошта сметка',
  'settings.account.description': 'Се користи за испраќање датотеки и проверка на прилози во одговори. Работи со Gmail, Outlook, Yahoo или произволен IMAP/SMTP сервер.',
  'settings.account.provider': 'Провајдер',
  'settings.account.email': 'Ваша е-пошта адреса',
  'settings.account.appPassword': 'Лозинка за апликација',
  'settings.account.appPasswordPlaceholder': 'Лозинка за апликација (не вашата обична лозинка)',
  'settings.account.smtpHost': 'SMTP хост',
  'settings.account.smtpPort': 'SMTP порт',
  'settings.account.imapHost': 'IMAP хост',
  'settings.account.imapPort': 'IMAP порт',
  'settings.account.testConnection': 'Тестирај врска',
  'settings.account.testSuccess': 'Врската е успешна (SMTP + IMAP)',
  'settings.account.testFailed': 'Врската не успеа',

  'settings.recipient.title': 'Примач и преземања',
  'settings.recipient.description': 'Каде се испраќаат датотеките и каде се зачувуваат прилозите од одговорите.',
  'settings.recipient.email': 'Е-пошта на примач',
  'settings.recipient.emailNote': 'Датотеките се испраќаат овде, и оваа адреса се проверува за прилози во одговорите. Може да ја промените во секое време.',
  'settings.recipient.downloadFolder': 'Папка за преземање',
  'settings.recipient.chooseFolder': 'Изберете папка…',

  'settings.saved': 'Поставките се зачувани',
  'settings.saveFailed': 'Зачувувањето на поставките не успеа',

  'provider.gmail.label': 'Gmail',
  'provider.outlook.label': 'Outlook / Microsoft 365',
  'provider.yahoo.label': 'Yahoo Mail',
  'provider.custom.label': 'Друг (произволен SMTP/IMAP)',
  'provider.gmail.help': 'Овозможете 2-степена верификација, потоа креирајте лозинка за апликација на myaccount.google.com/apppasswords и искористете ја овде (не вашата обична лозинка).',
  'provider.outlook.help': 'Овозможете 2-степена верификација, потоа креирајте лозинка за апликација на account.live.com/proofs/AppPassword и искористете ја овде.',
  'provider.yahoo.help': 'Овозможете 2-степена верификација, потоа генерирајте лозинка за апликација во делот за безбедност на вашата Yahoo сметка и искористете ја овде.',
  'provider.custom.help': 'Внесете детали за SMTP и IMAP хост/порт добиени од вашиот е-пошта провајдер или ИТ администратор.',
}

const dictionaries: Record<Language, Dict> = { en, mk }

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
}

interface I18nContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'efm-language'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null
    return stored === 'mk' || stored === 'en' ? stored : 'en'
  })

  useEffect(() => {
    window.api.getSettings?.().then((s: any) => {
      if (s?.language === 'mk' || s?.language === 'en') setLanguageState(s.language)
    }).catch(() => {})
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    window.localStorage.setItem(STORAGE_KEY, lang)
    window.api.saveSettings?.({ language: lang }).catch(() => {})
  }

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[language]
      const template = dict[key] ?? dictionaries.en[key] ?? key
      return interpolate(template, vars)
    }
  }, [language])

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
