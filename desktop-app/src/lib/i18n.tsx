import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'en' | 'mk'

type Dict = Record<string, string>

const en: Dict = {
  'app.title': 'pratiplati',
  'app.subtitle': 'Send files, collect responses',
  'nav.dashboard': 'Dashboard',
  'nav.settings': 'Settings',
  'nav.admin': 'Admin',

  'common.loading': 'Loading…',
  'common.save': 'Save settings',
  'common.saving': 'Saving…',
  'common.browse': 'Browse',
  'common.open': 'Open',
  'common.notSet': '(not set)',

  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Send files one by one, then check for reply attachments.',
  'dashboard.notConfigured': 'Go to {settings} and fill in your email account, app password, and recipient email before sending or checking.',
  'dashboard.notConnectedOAuth': 'Connect your {provider} account to start sending and checking.',
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

  'send.largeBatchWarning': 'You are about to send {count} emails. This may exceed daily sending limits and trigger spam filtering. Consider sending in smaller batches.',
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

  'settings.oauth.clientId': 'OAuth Client ID',
  'settings.oauth.clientSecret': 'OAuth Client Secret',
  'settings.oauth.clientSecretPlaceholder': 'Client secret (if required)',
  'settings.oauth.notConnected': 'Not connected. Click Connect to sign in with your account.',
  'settings.oauth.connectedAs': 'Connected as {email}',
  'settings.oauth.connect': 'Connect with {provider}',
  'settings.oauth.switchAccount': 'Switch account',
  'settings.oauth.disconnect': 'Disconnect',
  'settings.oauth.connected': 'Account connected',
  'settings.oauth.disconnected': 'Account disconnected',
  'settings.oauth.connectFailed': 'Failed to connect. Check your Client ID/Secret and try again.',
  'settings.oauth.disconnectFailed': 'Failed to disconnect',
  'settings.oauth.missingClientId': 'Enter your OAuth Client ID first',
  'admin.title': 'Admin',
  'admin.description': 'Manage OAuth client credentials for each provider. These are preloaded so users only need to log in.',
  'admin.lockedDescription': 'This area is restricted to the administrator.',
  'admin.password': 'Admin password',
  'admin.newPassword': 'Set an admin password',
  'admin.firstTime': 'No admin password is set yet. Create one to manage provider credentials.',
  'admin.setPassword': 'Set password',
  'admin.unlock': 'Unlock',
  'admin.wrongPassword': 'Incorrect password',
  'admin.clientId': 'OAuth Client ID',
  'admin.clientSecret': 'OAuth Client Secret',
  'admin.clientSecretPlaceholder': 'Client secret (if required)',
  'admin.saved': 'Saved',

  'settings.recipient.title': 'Recipient & downloads',
  'settings.recipient.description': 'Where files are sent to, and where reply attachments are saved.',
  'settings.recipient.email': 'Recipient email',
  'settings.recipient.emailNote': 'Files are sent here, and this is also the address we check for reply attachments. Change it anytime.',
  'settings.recipient.downloadFolder': 'Download folder',
  'settings.recipient.chooseFolder': 'Choose a folder…',

  'settings.saved': 'Settings saved',
  'settings.saveFailed': 'Failed to save settings',

  'settings.limits.title': 'Sending limits & deliverability',
  'settings.limits.description': 'Keep your email account within provider sending limits and avoid spam filtering.',
  'settings.limits.delay': 'Delay between sends (ms)',
  'settings.limits.delayNote': 'A short pause between each email keeps you within rate limits and reduces spam flags. Recommended: 2000 ms.',
  'settings.limits.subject': 'Email subject',
  'settings.limits.subjectNote': 'Leave empty to use the file name as the subject. A subject reduces the chance of being flagged as spam.',
  'settings.limits.providerLimit': 'Daily sending limit',
  'settings.limits.providerLimitUnknown': 'Check with your provider or IT admin.',
  'settings.limits.warning': 'Sending many emails at once can trigger spam filters and get your domain flagged. Keep batches small and stay under the daily limit.',

  'settings.privacy.title': 'Privacy & data storage',
  'settings.privacy.description': 'How your data is handled.',
  'settings.privacy.localFiles': 'Files and attachments are stored only on your machine (your chosen download folder) or in your own OneDrive/SharePoint/Google Drive — never on our servers.',
  'settings.privacy.localSettings': 'Your email address, app password, and settings are stored locally on your computer (encrypted at rest). Nothing is sent to any third-party server.',
  'settings.privacy.direct': 'The app connects directly to your email provider (SMTP/IMAP). No personal server is involved in sending or receiving.',
  'settings.privacy.gdpr': 'Because all data stays on your device, you remain in control and compliant with GDPR / local data-protection rules.',

  'provider.gmail.label': 'Gmail',
  'provider.outlook.label': 'Outlook / Microsoft 365',
  'provider.yahoo.label': 'Yahoo Mail',
  'provider.custom.label': 'Other (custom SMTP/IMAP)',
}

const mk: Dict = {
  'app.title': 'Управител на датотеки преку е-пошта',
  'app.subtitle': 'Испраќајте датотеки, собирајте одговори',
  'nav.dashboard': 'Контролна табла',
  'nav.settings': 'Поставки',
  'nav.admin': 'Администратор',

  'common.loading': 'Се вчитува…',
  'common.save': 'Зачувај поставки',
  'common.saving': 'Се зачувува…',
  'common.browse': 'Прегледај',
  'common.open': 'Отвори',
  'common.notSet': '(не е поставено)',

  'dashboard.title': 'Контролна табла',
  'dashboard.subtitle': 'Испраќајте датотеки една по една, потоа проверувајте за одговори со прилози.',
  'dashboard.notConfigured': 'Одете во {settings} и внесете ваша е-пошта, лозинка за апликација и е-пошта на примачот пред испраќање или проверка.',
  'dashboard.notConnectedOAuth': 'Поврзете ја вашата {provider} сметка за да започнете со испраќање и проверка.',
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

  'send.largeBatchWarning': 'Ќе испратите {count} е-пораки. Ова може да го надмине дневното ограничување и да активира филтрирање како спам. Размислете за испраќање во помали серии.',
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
  'settings.oauth.clientId': 'OAuth Client ID',
  'settings.oauth.clientSecret': 'OAuth Client Secret',
  'settings.oauth.clientSecretPlaceholder': 'Client secret (ако е потребен)',
  'settings.oauth.notConnected': 'Не е поврзано. Кликнете Поврзи за да се најавите со вашата сметка.',
  'settings.oauth.connectedAs': 'Поврзано како {email}',
  'settings.oauth.connect': 'Поврзи со {provider}',
  'settings.oauth.switchAccount': 'Промени сметка',
  'settings.oauth.disconnect': 'Исклучи',
  'settings.oauth.connected': 'Сметката е поврзана',
  'settings.oauth.disconnected': 'Сметката е исклучена',
  'settings.oauth.connectFailed': 'Поврзувањето не успеа. Проверете го Client ID/Secret и обидете се повторно.',
  'settings.oauth.disconnectFailed': 'Исклучувањето не успеа',
  'settings.oauth.missingClientId': 'Прво внесете го OAuth Client ID',
  'admin.title': 'Администратор',
  'admin.description': 'Управувајте со OAuth клиентските акредитиви за секој провајдер. Тие се претходно вчитани, па корисниците само треба да се најават.',
  'admin.lockedDescription': 'Овој дел е ограничен само за администраторот.',
  'admin.password': 'Администраторска лозинка',
  'admin.newPassword': 'Поставете администраторска лозинка',
  'admin.firstTime': 'Сè уште нема поставено администраторска лозинка. Креирајте една за да управувате со акредитивите на провајдерите.',
  'admin.setPassword': 'Постави лозинка',
  'admin.unlock': 'Отклучи',
  'admin.wrongPassword': 'Погрешна лозинка',
  'admin.clientId': 'OAuth Client ID',
  'admin.clientSecret': 'OAuth Client Secret',
  'admin.clientSecretPlaceholder': 'Client secret (ако е потребен)',
  'admin.saved': 'Зачувано',

  'settings.recipient.title': 'Примач и преземања',
  'settings.recipient.description': 'Каде се испраќаат датотеките и каде се зачувуваат прилозите од одговорите.',
  'settings.recipient.email': 'Е-пошта на примач',
  'settings.recipient.emailNote': 'Датотеките се испраќаат овде, и оваа адреса се проверува за прилози во одговорите. Може да ја промените во секое време.',
  'settings.recipient.downloadFolder': 'Папка за преземање',
  'settings.recipient.chooseFolder': 'Изберете папка…',

  'settings.saved': 'Поставките се зачувани',
  'settings.saveFailed': 'Зачувувањето на поставките не успеа',

  'settings.limits.title': 'Ограничувања при испраќање и достава',
  'settings.limits.description': 'Чувајте ја вашата е-пошта сметка во рамките на ограничувањата на провајдерот и избегнувајте филтрирање како спам.',
  'settings.limits.delay': 'Пауза помеѓу испраќањата (мс)',
  'settings.limits.delayNote': 'Кратка пауза помеѓу секоја е-пошта ве држи во рамките на ограничувањата и ги намалува ознаките за спам. Препорачано: 2000 мс.',
  'settings.limits.subject': 'Наслов на е-пошта',
  'settings.limits.subjectNote': 'Оставете празно за да се користи името на датотеката како наслов. Насловот ја намалува можноста да бидете означени како спам.',
  'settings.limits.providerLimit': 'Дневно ограничување за испраќање',
  'settings.limits.providerLimitUnknown': 'Проверете кај вашиот провајдер или ИТ администратор.',
  'settings.limits.warning': 'Испраќањето многу е-пораки одеднаш може да активира филтри за спам и да го означи вашиот домен. Држете ги сериите мали и останете под дневното ограничување.',

  'settings.privacy.title': 'Приватност и складирање податоци',
  'settings.privacy.description': 'Како се постапува со вашите податоци.',
  'settings.privacy.localFiles': 'Датотеките и прилозите се складираат само на вашата машина (во избраната папка за преземање) или во вашиот OneDrive/SharePoint/Google Drive — никогаш на нашите сервери.',
  'settings.privacy.localSettings': 'Вашата е-пошта адреса, лозинката за апликација и поставките се складираат локално на вашиот компјутер (шифрирани). Ништо не се испраќа до трети сервери.',
  'settings.privacy.direct': 'Апликацијата се поврзува директно со вашиот е-пошта провајдер (SMTP/IMAP). Не е вклучен личен сервер при испраќање или примање.',
  'settings.privacy.gdpr': 'Бидејќи сите податоци остануваат на вашиот уред, вие останувате во контрола и во согласност со GDPR / локалните правила за заштита на податоци.',

  'provider.gmail.label': 'Gmail',
  'provider.outlook.label': 'Outlook / Microsoft 365',
  'provider.yahoo.label': 'Yahoo Mail',
  'provider.custom.label': 'Друг (произволен SMTP/IMAP)',
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
