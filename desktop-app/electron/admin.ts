import Store from 'electron-store'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import type { ProviderId } from './providers'

export interface ProviderClientCredentials {
  clientId: string
  clientSecret: string
}

export interface AdminConfig {
  hasPassword: boolean
  providers: Record<ProviderId, ProviderClientCredentials>
}

interface AdminStoreSchema {
  passwordHash: string | null
  salt: string | null
  providers: Record<ProviderId, ProviderClientCredentials>
}

const EMPTY_CREDS: ProviderClientCredentials = { clientId: '', clientSecret: '' }

// Credentials baked in at build time (from oauth-credentials.json). Loaded at
// runtime so the build does not fail when the file is absent (e.g. in CI, where
// the real credentials are intentionally not committed). Used as a fallback so
// users can connect without any admin setup.
function loadBakedCredentials(): Record<ProviderId, ProviderClientCredentials> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require('./oauth-credentials.json') as Record<string, { clientId?: string; clientSecret?: string }>
    return {
      gmail: raw.gmail?.clientId ? { clientId: raw.gmail.clientId, clientSecret: raw.gmail.clientSecret ?? '' } : { ...EMPTY_CREDS },
      outlook: raw.outlook?.clientId ? { clientId: raw.outlook.clientId, clientSecret: raw.outlook.clientSecret ?? '' } : { ...EMPTY_CREDS },
      yahoo: raw.yahoo?.clientId ? { clientId: raw.yahoo.clientId, clientSecret: raw.yahoo.clientSecret ?? '' } : { ...EMPTY_CREDS },
      custom: { ...EMPTY_CREDS },
    }
  } catch {
    return {
      gmail: { ...EMPTY_CREDS },
      outlook: { ...EMPTY_CREDS },
      yahoo: { ...EMPTY_CREDS },
      custom: { ...EMPTY_CREDS },
    }
  }
}

const BAKED_CREDS = loadBakedCredentials()

const store = new Store<AdminStoreSchema>({
  name: 'admin',
  defaults: {
    passwordHash: null,
    salt: null,
    providers: {
      gmail: { ...EMPTY_CREDS },
      outlook: { ...EMPTY_CREDS },
      yahoo: { ...EMPTY_CREDS },
      custom: { ...EMPTY_CREDS },
    },
  },
  encryptionKey: 'pratiplati-admin-store',
})

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

export function getAdminConfig(): AdminConfig {
  const providers = (store.get('providers') as Record<ProviderId, ProviderClientCredentials>) ?? {}
  return {
    hasPassword: Boolean(store.get('passwordHash')),
    providers: {
      gmail: providers.gmail?.clientId ? providers.gmail : BAKED_CREDS.gmail,
      outlook: providers.outlook?.clientId ? providers.outlook : BAKED_CREDS.outlook,
      yahoo: providers.yahoo?.clientId ? providers.yahoo : BAKED_CREDS.yahoo,
      custom: providers.custom ?? { ...EMPTY_CREDS },
    },
  }
}

export function setAdminPassword(password: string): void {
  const salt = randomBytes(16).toString('hex')
  store.set('passwordHash', hashPassword(password, salt))
  store.set('salt', salt)
}

export function verifyAdminPassword(password: string): boolean {
  const hash = store.get('passwordHash')
  const salt = store.get('salt')
  if (!hash || !salt) return false
  const candidate = hashPassword(password, salt)
  const a = Buffer.from(candidate, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function setProviderCredentials(provider: ProviderId, clientId: string, clientSecret: string): void {
  const providers = (store.get('providers') as Record<ProviderId, ProviderClientCredentials>) ?? {}
  providers[provider] = { clientId: clientId.trim(), clientSecret: clientSecret.trim() }
  store.set('providers', providers)
}

export function getProviderCredentials(provider: ProviderId): ProviderClientCredentials {
  const providers = (store.get('providers') as Record<ProviderId, ProviderClientCredentials>) ?? {}
  const stored = providers[provider]
  if (stored?.clientId) return stored
  return BAKED_CREDS[provider] ?? { ...EMPTY_CREDS }
}
