import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipcHandlers';
import { createTray } from './tray';
import { config } from './config';
import { spawn } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let pythonProcess: any = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: config.security.nodeIntegration,
      contextIsolation: config.security.contextIsolation,
      sandbox: config.security.sandbox,
    },
  });

  const startUrl = config.isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
};

const startPythonService = () => {
  if (!config.isDev) return;
  pythonProcess = spawn('node', ['../scripts/start-python.js'], {
    stdio: 'inherit'
  });
};

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers(mainWindow);
  createTray(mainWindow, app);
  startPythonService();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});
