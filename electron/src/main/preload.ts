import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { PresenceUpdate, AppConfig, HealthCheck } from '../../shared/types';

/**
 * Secure bridge between renderer and main process
 * Only expose necessary APIs to renderer
 */

const electronAPI = {
  // Presence monitoring
  onPresenceUpdate: (callback: (data: PresenceUpdate) => void) => {
    ipcRenderer.on('presence:update', (_event: IpcRendererEvent, data: PresenceUpdate) => {
      callback(data);
    });
  },

  offPresenceUpdate: () => {
    ipcRenderer.removeAllListeners('presence:update');
  },

  // Health check
  onHealthCheck: (callback: (data: HealthCheck) => void) => {
    ipcRenderer.on('health:check', (_event: IpcRendererEvent, data: HealthCheck) => {
      callback(data);
    });
  },

  // Settings
  getSettings: (): Promise<AppConfig> => {
    return ipcRenderer.invoke('settings:get');
  },

  updateSettings: (config: Partial<AppConfig>): Promise<void> => {
    return ipcRenderer.invoke('settings:update', config);
  },

  // Privacy mode
  setPrivacyMode: (active: boolean): Promise<void> => {
    return ipcRenderer.invoke('privacy:toggle', active);
  },

  // App control
  minimizeWindow: () => {
    ipcRenderer.send('window:minimize');
  },

  closeWindow: () => {
    ipcRenderer.send('window:close');
  },

  // Error handling
  onError: (callback: (error: any) => void) => {
    ipcRenderer.on('error', (_event: IpcRendererEvent, error) => {
      callback(error);
    });
  },

  offError: () => {
    ipcRenderer.removeAllListeners('error');
  },
};

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Log that preload is ready
console.log('[Preload] Electron context bridge loaded');
