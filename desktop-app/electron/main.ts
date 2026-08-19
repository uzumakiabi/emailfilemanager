import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { getSettings, saveSettings, getLogs, addLog, clearLogs } from './store'
import { sendFiles, checkResponses, testConnection } from './mail'
import { PROVIDER_PRESETS } from './providers'
import { startOAuthFlow } from './oauth'
import { getAdminConfig, setAdminPassword, verifyAdminPassword, setProviderCredentials, getProviderCredentials } from './admin'
import type { AppSettings } from './types'

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 780,
    minWidth: 860,
    minHeight: 600,
    title: 'pratiplati',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('settings:get', () => getSettings())
ipcMain.handle('settings:save', (_e, next: Partial<AppSettings>) => saveSettings(next))
ipcMain.handle('settings:providerPresets', () => PROVIDER_PRESETS)

ipcMain.handle('logs:get', (_e, take?: number) => getLogs(take))
ipcMain.handle('logs:clear', () => clearLogs())

ipcMain.handle('dialog:pickFiles', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })
  if (res.canceled) return []
  return res.filePaths
})

ipcMain.handle('dialog:pickFolder', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
  if (res.canceled) return null
  return res.filePaths[0] ?? null
})

ipcMain.handle('mail:sendFiles', async (_e, filePaths: string[]) => {
  const settings = getSettings()
  try {
    return { ok: true, data: await sendFiles(settings, filePaths) }
  } catch (e: any) {
    addLog({ action: 'ERROR', status: 'FAILED', message: `Send files error: ${e?.message ?? 'unknown'}` })
    return { ok: false, error: e?.message ?? 'Send error' }
  }
})

ipcMain.handle('mail:checkResponses', async () => {
  const settings = getSettings()
  try {
    return { ok: true, data: await checkResponses(settings) }
  } catch (e: any) {
    addLog({ action: 'ERROR', status: 'FAILED', message: `Check responses error: ${e?.message ?? 'unknown'}` })
    return { ok: false, error: e?.message ?? 'Check error' }
  }
})

ipcMain.handle('mail:testConnection', async (_e, override?: Partial<AppSettings>) => {
  const settings = { ...getSettings(), ...(override ?? {}) }
  return testConnection(settings)
})

ipcMain.handle('oauth:start', async (_e, provider: AppSettings['provider']) => {
  try {
    const creds = getProviderCredentials(provider)
    if (!creds.clientId) {
      throw new Error(`OAuth is not configured for ${provider}. Ask the administrator to add the Client ID in the Admin tab.`)
    }
    const result = await startOAuthFlow(provider, creds.clientId, creds.clientSecret)
    const current = getSettings()
    // Google only returns a refresh_token the FIRST time a given client+account is
    // authorized. On a re-connect of the same account it returns none, so we must
    // keep the previously stored refresh token instead of wiping it — otherwise the
    // account becomes unusable ("no refresh token") after the first reconnect.
    const refreshToken = result.refreshToken || current.oauthRefreshToken || ''
    const merged = saveSettings({
      provider,
      authMethod: 'oauth',
      email: result.email || current.email,
      oauthAccessToken: result.accessToken,
      oauthRefreshToken: refreshToken,
      oauthTokenExpiry: result.expiry,
      oauthEmail: result.email || '',
    })
    addLog({ action: 'INFO', status: 'SUCCESS', message: `Connected ${provider} account${result.email ? ` (${result.email})` : ''} via OAuth` })
    return { ok: true, data: merged }
  } catch (e: any) {
    addLog({ action: 'ERROR', status: 'FAILED', message: `OAuth connect error: ${e?.message ?? 'unknown'}` })
    return { ok: false, error: e?.message ?? 'OAuth error' }
  }
})

ipcMain.handle('oauth:disconnect', async () => {
  const merged = saveSettings({
    oauthAccessToken: '',
    oauthRefreshToken: '',
    oauthTokenExpiry: null,
    oauthEmail: '',
  })
  addLog({ action: 'INFO', status: 'SUCCESS', message: 'Disconnected email account' })
  return merged
})

ipcMain.handle('admin:getConfig', () => getAdminConfig())

ipcMain.handle('admin:setPassword', (_e, password: string) => {
  if (!password || password.length < 4) {
    return { ok: false, error: 'Admin password must be at least 4 characters.' }
  }
  setAdminPassword(password)
  return { ok: true }
})

ipcMain.handle('admin:verifyPassword', (_e, password: string) => {
  return { ok: verifyAdminPassword(password) }
})

ipcMain.handle('admin:setProviderCredentials', (_e, provider: AppSettings['provider'], clientId: string, clientSecret: string) => {
  setProviderCredentials(provider, clientId, clientSecret)
  return { ok: true }
})
