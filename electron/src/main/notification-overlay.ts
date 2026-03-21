/**
 * Notification overlay management
 * Handles creation and lifecycle of privacy blur overlays
 */

import { BrowserWindow, screen } from 'electron';
import path from 'path';

interface OverlayWindow {
  window: BrowserWindow;
  display: Electron.Display;
}

const overlayWindows: Map<number, OverlayWindow> = new Map();

/**
 * Create notification blur overlay for a specific display
 */
export const createOverlay = (displayId: number) => {
  if (overlayWindows.has(displayId)) {
    return; // Already exists
  }

  try {
    const display = screen.getDisplayMatching({ id: displayId });
    if (!display) return;

    const overlayWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      type: 'desktop',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'overlay-preload.js'),
      },
    });

    // Load overlay HTML
    overlayWindow.loadFile(path.join(__dirname, '../../overlay.html'));

    overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    overlayWindow.on('closed', () => {
      overlayWindows.delete(displayId);
    });

    overlayWindows.set(displayId, {
      window: overlayWindow,
      display,
    });

    console.log(`[Overlay] Created for display ${displayId}`);
  } catch (error) {
    console.error('[Overlay] Error creating overlay:', error);
  }
};

/**
 * Destroy overlay for specific display
 */
export const destroyOverlay = (displayId: number) => {
  const overlay = overlayWindows.get(displayId);
  if (overlay) {
    try {
      overlay.window.close();
      overlayWindows.delete(displayId);
      console.log(`[Overlay] Destroyed for display ${displayId}`);
    } catch (error) {
      console.error('[Overlay] Error destroying overlay:', error);
    }
  }
};

/**
 * Destroy all overlays
 */
export const destroyAllOverlays = () => {
  overlayWindows.forEach((overlay, displayId) => {
    try {
      overlay.window.close();
    } catch (error) {
      console.error(`[Overlay] Error closing overlay ${displayId}:`, error);
    }
  });
  overlayWindows.clear();
  console.log('[Overlay] All overlays destroyed');
};

/**
 * Update overlay blur intensity
 */
export const updateOverlayBlur = (displayId: number, intensity: number) => {
  const overlay = overlayWindows.get(displayId);
  if (overlay) {
    overlay.window.webContents.send('blur:update', { intensity });
  }
};

/**
 * Show all overlays
 */
export const showAllOverlays = () => {
  overlayWindows.forEach((overlay) => {
    overlay.window.show();
  });
};

/**
 * Hide all overlays
 */
export const hideAllOverlays = () => {
  overlayWindows.forEach((overlay) => {
    overlay.window.hide();
  });
};

/**
 * Get overlay state
 */
export const getOverlayState = () => {
  return {
    count: overlayWindows.size,
    displays: Array.from(overlayWindows.keys()),
  };
};

/**
 * Handle multi-display scenarios
 */
export const updateOverlaysForDisplays = (shouldShow: boolean) => {
  const displays = screen.getAllDisplays();

  // Create overlays for all displays if showing
  if (shouldShow) {
    displays.forEach((display) => {
      createOverlay(display.id);
    });
  } else {
    // Destroy all overlays if not showing
    destroyAllOverlays();
  }
};
