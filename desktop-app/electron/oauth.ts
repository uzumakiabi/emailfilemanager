import { shell } from 'electron'
import http from 'http'
import { createHash, randomBytes } from 'crypto'
import type { ProviderId } from './providers'

export interface OAuthProviderConfig {
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  usePkce: boolean
  useClientSecret: boolean
  userInfoUrl?: string
  /** Value for the `prompt` param, forcing the account chooser so the OS browser's
   *  existing session for a different account is never silently reused. */
  prompt: string
}

export const OAUTH_PROVIDERS: Record<ProviderId, OAuthProviderConfig | null> = {
  gmail: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    // https://mail.google.com/ grants full Gmail access for sending/reading.
    // openid + email + profile are required so the userinfo endpoint returns the
    // account's email address — without them the app can't tell which account was
    // authorized and falls back to showing the previously-connected account.
    scopes: ['https://mail.google.com/', 'openid', 'email', 'profile'],
    usePkce: false,
    useClientSecret: true,
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    prompt: 'select_account consent',
  },
  outlook: {
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'https://outlook.office.com/SMTP.Send',
      'https://outlook.office.com/IMAP.AccessAsUser.All',
      'offline_access',
      'openid',
      'profile',
      'email',
    ],
    usePkce: true,
    useClientSecret: false,
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    prompt: 'select_account',
  },
  yahoo: {
    authorizeUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token',
    scopes: ['mail-r', 'mail-w', 'smtp-w'],
    usePkce: false,
    useClientSecret: true,
    userInfoUrl: 'https://api.login.yahoo.com/openid/v1/userinfo',
    prompt: 'login',
  },
  custom: null,
}

// Preferred loopback port. If it is already in use, a free port is chosen automatically.
// Google and Microsoft accept any loopback port, so register the redirect URI as:
//   http://localhost
// (Yahoo requires an exact match — register the specific port it reports, or use a fixed port.)
export const OAUTH_REDIRECT_PORT = 3000

export interface OAuthResult {
  accessToken: string
  refreshToken: string | null
  expiry: number | null
  email: string | null
}

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function sha256(input: string): Buffer {
  return createHash('sha256').update(input).digest()
}

function getConfig(provider: ProviderId): OAuthProviderConfig {
  const config = OAUTH_PROVIDERS[provider]
  if (!config) throw new Error(`Provider "${provider}" does not support OAuth. Use SMTP/IMAP credentials instead.`)
  return config
}

function assertClientCredentials(provider: ProviderId, clientId: string, clientSecret: string) {
  const config = getConfig(provider)
  if (!clientId?.trim()) throw new Error('OAuth Client ID is missing. Enter it in Settings.')
  if (config.useClientSecret && !clientSecret?.trim()) {
    throw new Error('OAuth Client Secret is missing. Enter it in Settings.')
  }
}

/**
 * Runs the full OAuth2 authorization-code flow:
 * opens the provider's consent page in the system browser, catches the
 * redirect on a local loopback server, and exchanges the code for tokens.
 */
export async function startOAuthFlow(provider: ProviderId, clientId: string, clientSecret: string): Promise<OAuthResult> {
  const config = getConfig(provider)
  assertClientCredentials(provider, clientId, clientSecret)

  const state = randomBytes(16).toString('hex')
  const codeVerifier = config.usePkce ? randomBytes(32).toString('base64url') : undefined
  const codeChallenge = codeVerifier ? base64url(sha256(codeVerifier)) : undefined

  // Bind the callback server to a free port (prefer 3000, fall back to any free port).
  // The redirect URI must use the actual bound port.
  const { port, server } = await new Promise<{ port: number; server: http.Server }>((resolve, reject) => {
    const srv = http.createServer()
    const tryListen = (p: number) => {
      srv.once('error', (e: any) => {
        if (e?.code === 'EADDRINUSE' && p !== 0) {
          // Port taken — retry on an OS-assigned free port.
          tryListen(0)
        } else {
          reject(new Error(`OAuth callback server error: ${e?.message ?? 'unknown'}`))
        }
      })
      srv.listen(p, () => {
        const addr = srv.address()
        const boundPort = typeof addr === 'object' && addr ? addr.port : p
        resolve({ port: boundPort, server: srv })
      })
    }
    tryListen(OAUTH_REDIRECT_PORT)
  })

  const redirectUri = `http://localhost:${port}/`

  const params = new URLSearchParams({
    client_id: clientId.trim(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    access_type: 'offline',
    // Always show the account chooser, even if the system browser already has
    // an active session for a different account. Without this, "Connect" can
    // silently reuse whatever account is currently signed into the browser
    // instead of letting the user pick the intended one.
    prompt: config.prompt,
  })
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge)
    params.set('code_challenge_method', 'S256')
  }
  const authUrl = `${config.authorizeUrl}?${params.toString()}`

  const { code, error } = await new Promise<{ code?: string; error?: string }>((resolve, reject) => {
    server.on('request', (req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`)
      const code = url.searchParams.get('code') ?? undefined
      const err = url.searchParams.get('error') ?? undefined
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        '<html><body style="font-family:sans-serif;text-align:center;padding-top:60px">' +
          '<h3>You can close this window and return to the app.</h3></body></html>',
      )
      server.close()
      resolve({ code, error: err })
    })
    server.on('error', (e: any) => reject(new Error(`OAuth callback server error: ${e?.message ?? 'unknown'}`)))
    shell.openExternal(authUrl)
  })

  if (error) throw new Error(`Authorization failed: ${error}`)
  if (!code) throw new Error('No authorization code was returned.')

  const body = new URLSearchParams({
    client_id: clientId.trim(),
    redirect_uri: redirectUri,
    code,
    grant_type: 'authorization_code',
  })
  if (config.useClientSecret) body.set('client_secret', clientSecret.trim())
  if (codeVerifier) body.set('code_verifier', codeVerifier)

  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const tokenData: any = await tokenRes.json().catch(() => ({}))
  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${tokenData?.error_description ?? tokenData?.error ?? tokenRes.status}`)
  }
  if (!tokenData?.access_token) throw new Error('Token exchange returned no access token.')

  let email: string | null = null
  if (config.userInfoUrl) {
    try {
      const infoRes = await fetch(config.userInfoUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const info: any = await infoRes.json().catch(() => ({}))
      email = info?.email ?? info?.preferred_username ?? null
      console.log('[oauth] userinfo response:', JSON.stringify({ status: infoRes.status, email, hasError: !!info?.error }))
    } catch (e: any) {
      console.log('[oauth] userinfo fetch failed:', e?.message ?? e)
      email = null
    }
  }

  console.log('[oauth] token exchange result:', JSON.stringify({
    hasAccessToken: !!tokenData.access_token,
    hasRefreshToken: !!tokenData.refresh_token,
    email,
    scope: tokenData.scope,
  }))

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? null,
    expiry: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
    email,
  }
}

export interface RefreshedToken {
  accessToken: string
  expiry: number | null
}

/** Refreshes an access token using the stored refresh token. */
export async function refreshAccessToken(
  provider: ProviderId,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<RefreshedToken> {
  const config = getConfig(provider)
  if (!refreshToken) throw new Error('No refresh token available. Reconnect your account.')

  const body = new URLSearchParams({
    client_id: clientId.trim(),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  if (config.useClientSecret) body.set('client_secret', clientSecret.trim())

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok || !data?.access_token) {
    throw new Error(`Token refresh failed: ${data?.error_description ?? data?.error ?? res.status}`)
  }
  return {
    accessToken: data.access_token,
    expiry: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
  }
}
