import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc-handlers';
import { createTray, setMainWindow, destroyTray } from './tray';

let mainWindow: BrowserWindow | null = null;

const isDev = () => {
  return process.env.NODE_ENV === 'development' || process.mainModule?.filename.includes('node_modules');
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const startUrl = isDev()
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../dist/renderer/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev()) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', () => {
    mainWindow?.hide();
  });

  return mainWindow;
};

const startPythonService = async () => {
  console.log('[Electron] Python service should be running on ws://localhost:8765');
};

app.on('ready', () => {
  const window = createWindow();
  setMainWindow(window);
  createTray();
  setupIpcHandlers();
  startPythonService();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  destroyTray();
});

app.on('activate', () => {
  if (mainWindow === null) {
    const window = createWindow();
    setMainWindow(window);
  } else {
    mainWindow.show();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (mainWindow) {
    mainWindow.webContents.send('error', { message: error.message });
  }
});
