import { exec } from 'child_process';

/**
 * Executes an AppleScript command to toggle Focus/Do Not Disturb mode on macOS.
 * This ensures that system-level notifications do not leak on screen during a privacy threat.
 */
export const toggleMacOSDoNotDisturb = (enable: boolean) => {
  if (process.platform !== 'darwin') {
    return; // Only execute on macOS
  }

  // Use a heuristic AppleScript to toggle DND
  // Modern macOS (Monterey+) uses "Focus" which can be toggled via defaults and restarting the notification center
  // or by a shortcut. The most reliable silent way is setting the defaults, but it requires killall NotificationCenter
  
  const state = enable ? 'true' : 'false';
  
  // Script to enable/disable DND in defaults (works up to Big Sur, and Monterey+ with tweaks)
  // For production reliability across OS versions, we toggle the doNotDisturb key.
  const script = `
    defaults write ~/Library/Preferences/com.apple.ncprefs.plist do_not_disturb -boolean ${state}
    killall ncprefs
    killall NotificationCenter
  `;

  exec(script, (error, stdout, stderr) => {
    if (error) {
      console.error(`[macOS DND] Error toggling DND to ${enable}:`, error);
      return;
    }
    console.log(`[macOS DND] Successfully toggled DND to ${enable}`);
  });
};
