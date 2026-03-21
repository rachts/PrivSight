import { Tray, Menu, app, BrowserWindow } from 'electron';

let tray: Tray | null = null;

export const createTray = (mainWindow: BrowserWindow | null, appRef: Electron.App) => {
  const iconInfo = require('electron').nativeImage.createEmpty();
  tray = new Tray(iconInfo);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Enable Privacy Mode',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('tray:action', 'toggle_privacy');
      }
    },
    {
      label: 'Register Face',
      click: () => {
        if (mainWindow) {
            mainWindow.webContents.send('tray:action', 'register_face');
            mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        appRef.quit();
      }
    }
  ]);

  tray.setToolTip('PrivSight AI');
  tray.setContextMenu(contextMenu);
  return tray;
};
