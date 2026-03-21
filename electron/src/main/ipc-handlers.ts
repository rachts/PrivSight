import { ipcMain, BrowserWindow } from 'electron';
import WebSocket from 'ws';
import type { AppConfig, PresenceUpdate, HealthCheck, PresenceStatus } from '../../shared/types';
import { updateOverlaysForDisplays } from './notification-overlay';
import { toggleMacOSDoNotDisturb } from './macos-dnd';

let pythonSocket: WebSocket | null = null;
let mainWindow: BrowserWindow | null = null;
let appConfig: AppConfig = {
  sensitivity: 80,
  updateFrequency: 200,
  blurIntensity: 15,
  autoStart: false,
  privacyModeActive: false,
};

let healthCheckInterval: NodeJS.Timeout | null = null;
let currentPresenceStatus: PresenceStatus = 'no_face';
let overlayActive = false;

/**
 * Initialize IPC handlers and WebSocket connection to Python backend
 */
export const setupIpcHandlers = () => {
  // Get main window reference
  ipcMain.handle('window:get', () => {
    return mainWindow?.id;
  });

  // Settings handlers
  ipcMain.handle('settings:get', () => {
    return appConfig;
  });

  ipcMain.handle('settings:update', (_event, config: Partial<AppConfig>) => {
    appConfig = { ...appConfig, ...config };
    
    // Send config update to Python backend
    if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN) {
      pythonSocket.send(JSON.stringify({
        type: 'config_update',
        payload: appConfig,
      }));
    }

    // Broadcast to all windows
    mainWindow?.webContents.send('settings:updated', appConfig);
    return Promise.resolve();
  });

  // Privacy mode toggle
  ipcMain.handle('privacy:toggle', (_event, active: boolean) => {
    appConfig.privacyModeActive = active;
    mainWindow?.webContents.send('privacy:changed', active);
    return Promise.resolve();
  });

  // Window control
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });

  // Connect to Python service
  connectToPythonService();

  // Start health check
  startHealthCheck();
};

/**
 * Connect to Python WebSocket server
 */
const connectToPythonService = () => {
  const PYTHON_WS_URL = process.env.PYTHON_WS_URL || 'ws://localhost:8765';
  const MAX_RECONNECT_ATTEMPTS = 5;
  let reconnectAttempts = 0;

  const connect = () => {
    try {
      pythonSocket = new WebSocket(PYTHON_WS_URL);

      pythonSocket.onopen = () => {
        console.log('[IPC] Connected to Python service');
        reconnectAttempts = 0;

        // Send initial config
        pythonSocket?.send(JSON.stringify({
          type: 'init',
          payload: appConfig,
        }));

        // Notify renderer
        mainWindow?.webContents.send('service:connected', { status: 'connected' });
      };

      pythonSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'presence_update') {
            const presenceData: PresenceUpdate = message.payload;
            currentPresenceStatus = presenceData.status;

            // Determine if notifications should be hidden
            const shouldHide = shouldHideNotifications();

            // Update overlay visibility
            if (shouldHide && !overlayActive) {
              updateOverlaysForDisplays(true);
              toggleMacOSDoNotDisturb(true);
              overlayActive = true;
              console.log('[IPC] Notifications hidden - showing overlay');
            } else if (!shouldHide && overlayActive) {
              updateOverlaysForDisplays(false);
              toggleMacOSDoNotDisturb(false);
              overlayActive = false;
              console.log('[IPC] Notifications visible - hiding overlay');
            }

            mainWindow?.webContents.send('presence:update', presenceData);
          } else if (message.type === 'health_check') {
            // Respond to health check
            pythonSocket?.send(JSON.stringify({
              type: 'health_response',
              payload: { timestamp: Date.now() },
            }));
          }
        } catch (error) {
          console.error('[IPC] Error parsing message:', error);
        }
      };

      pythonSocket.onerror = (error) => {
        console.error('[IPC] WebSocket error:', error);
        mainWindow?.webContents.send('service:error', { 
          message: 'Connection error with Python service' 
        });
      };

      pythonSocket.onclose = () => {
        console.log('[IPC] Disconnected from Python service');
        mainWindow?.webContents.send('service:disconnected', { status: 'disconnected' });

        // Attempt reconnection
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`[IPC] Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          setTimeout(connect, 2000 * reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('[IPC] Connection error:', error);
    }
  };

  connect();
};

/**
 * Periodic health check with Python service
 */
const startHealthCheck = () => {
  healthCheckInterval = setInterval(() => {
    if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN) {
      pythonSocket.send(JSON.stringify({
        type: 'health_check',
        payload: { timestamp: Date.now() },
      }));
    }
  }, 5000);
};

/**
 * Determine if notifications should be hidden based on status
 */
const shouldHideNotifications = (): boolean => {
  if (appConfig.privacyModeActive) return true;

  switch (currentPresenceStatus) {
    case 'user_detected':
    case 'face_detected':
    case 'multiple_faces_safe':
      return false;
    case 'no_face':
    case 'unknown_detected':
    case 'unknown_user':
    case 'multiple_faces':
    case 'privacy_mode_active':
    case 'shoulder_surfing_active':
    case 'error':
    case 'no_camera':
      return true;
    default:
      return true;
  }
};

/**
 * Cleanup on app exit
 */
export const cleanupIpc = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  if (pythonSocket) {
    pythonSocket.close();
  }
  updateOverlaysForDisplays(false);
};
