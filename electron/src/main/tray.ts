import { Tray, Menu, BrowserWindow, app, ipcMain } from 'electron';

let trayInstance: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let currentMenu: Menu | null = null;

/**
 * Create and manage system tray icon
 */
export const createTray = (): Tray => {
  // Create a simple colored circle as tray icon
  const icon = require('electron').nativeImage.createEmpty();

  if (!trayInstance) {
    trayInstance = new Tray(icon);

      currentMenu = Menu.buildFromTemplate([
        {
          label: 'Privacy Protector',
          enabled: false,
        },
        { type: 'separator' },
        {
          label: 'Status: Checking...',
          enabled: false,
          id: 'status',
        },
        { type: 'separator' },
        {
          label: 'Open Dashboard',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          },
        },
        {
          label: 'Toggle Privacy Mode',
          id: 'toggle-privacy',
          click: () => {
            if (mainWindow) {
              // Signal renderer to toggle privacy manually (or call IPC)
              mainWindow.webContents.send('tray:action', 'toggle_privacy');
            }
          },
        },
        {
          label: 'Register Face',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('tray:action', 'register_face');
              mainWindow.show();
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ]);
      trayInstance.setContextMenu(currentMenu);

    trayInstance.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    trayInstance.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }

  return trayInstance;
};

/**
 * Update tray status menu item
 */
export const updateTrayStatus = (statusText: string, tooltip?: string) => {
  if (trayInstance && currentMenu) {
    const statusItem = currentMenu.getMenuItemById('status');
    if (statusItem) {
      statusItem.label = `Status: ${statusText}`;
      trayInstance.setContextMenu(currentMenu);
    }
  }

  if (tooltip) {
    trayInstance?.setToolTip(tooltip);
  }
};

/**
 * Set main window reference for tray
 */
export const setMainWindow = (window: BrowserWindow | null) => {
  mainWindow = window;
};

/**
 * Destroy tray
 */
export const destroyTray = () => {
  if (trayInstance) {
    trayInstance.destroy();
    trayInstance = null;
  }
};
