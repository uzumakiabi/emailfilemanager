import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings } from './types'

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (next: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', next),
  getProviderPresets: () => ipcRenderer.invoke('settings:providerPresets'),

  getLogs: (take?: number) => ipcRenderer.invoke('logs:get', take),
  clearLogs: () => ipcRenderer.invoke('logs:clear'),

  pickFiles: () => ipcRenderer.invoke('dialog:pickFiles'),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),

  sendFiles: (filePaths: string[]) => ipcRenderer.invoke('mail:sendFiles', filePaths),
  checkResponses: () => ipcRenderer.invoke('mail:checkResponses'),
  testConnection: (override?: Partial<AppSettings>) => ipcRenderer.invoke('mail:testConnection', override),

  startOAuth: (provider: AppSettings['provider']) => ipcRenderer.invoke('oauth:start', provider),
  disconnectOAuth: () => ipcRenderer.invoke('oauth:disconnect'),

  getAdminConfig: () => ipcRenderer.invoke('admin:getConfig'),
  setAdminPassword: (password: string) => ipcRenderer.invoke('admin:setPassword', password),
  verifyAdminPassword: (password: string) => ipcRenderer.invoke('admin:verifyPassword', password),
  setProviderCredentials: (provider: AppSettings['provider'], clientId: string, clientSecret: string) =>
    ipcRenderer.invoke('admin:setProviderCredentials', provider, clientId, clientSecret),
})
