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
  testConnection: () => ipcRenderer.invoke('mail:testConnection'),
})
