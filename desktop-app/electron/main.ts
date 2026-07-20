import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { getSettings, saveSettings, getLogs, addLog, clearLogs } from './store'
import { sendFiles, checkResponses, testConnection } from './mail'
import { PROVIDER_PRESETS } from './providers'
import type { AppSettings } from './types'

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 780,
    minWidth: 860,
    minHeight: 600,
    title: 'Email File Manager',
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

ipcMain.handle('mail:testConnection', async () => {
  const settings = getSettings()
  return testConnection(settings)
})
