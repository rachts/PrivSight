import { ipcMain, BrowserWindow } from 'electron';

export const setupIpcHandlers = (mainWindow: BrowserWindow | null) => {
  ipcMain.handle('privacy:toggle', (_event, active: boolean) => {
    // Basic IPC toggle handler
    mainWindow?.webContents.send('privacy:changed', active);
    return Promise.resolve();
  });

  ipcMain.handle('settings:get', () => {
    return Promise.resolve({
      sensitivity: 80,
      privacyModeActive: false,
    });
  });
};
