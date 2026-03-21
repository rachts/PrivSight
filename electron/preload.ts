import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  togglePrivacy: (enabled: boolean) => ipcRenderer.invoke('privacy:toggle', enabled),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  onPresenceUpdate: (callback: (data: any) => void) => ipcRenderer.on('presence:update', (_event, value) => callback(value)),
});
