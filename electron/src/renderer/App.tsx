import React, { useState, useEffect, useRef } from 'react';
import type { ElectronAPI, PresenceState, AppState } from './types';
import type { AppConfig, PresenceUpdate } from '../../shared/types';
import Page from './page';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    presence: {
      status: 'no_face',
      timestamp: 0,
      confidence: 0,
      detectedFaces: 0,
    },
    config: {
      sensitivity: 80,
      updateFrequency: 200,
      blurIntensity: 15,
      autoStart: false,
      privacyModeActive: false,
    },
    privacyModeActive: false,
    serviceConnected: false,
    error: null,
  });

  const electronAPIRef = useRef<ElectronAPI | null>(null);

  useEffect(() => {
    // Get Electron API
    electronAPIRef.current = window.electronAPI;

    if (!electronAPIRef.current) {
      console.error('[App] Electron API not available');
      setAppState(prev => ({ ...prev, error: 'Electron API not available' }));
      return;
    }

    // Load initial settings
    electronAPIRef.current.getSettings()
      .then(config => {
        console.log('[App] Loaded config:', config);
        setAppState(prev => ({ ...prev, config }));
      })
      .catch(err => {
        console.error('[App] Error loading config:', err);
        setAppState(prev => ({ ...prev, error: 'Failed to load settings' }));
      });

    // Listen for presence updates
    const unsubscribePresence = electronAPIRef.current.onPresenceUpdate((presence) => {
      console.log('[App] Presence update:', presence);
      setAppState(prev => ({
        ...prev,
        presence: {
          status: presence.status,
          timestamp: presence.timestamp,
          confidence: presence.confidence || 0,
          detectedFaces: presence.detectedFaces || 0,
        },
      }));
    });

    // Listen for service connection status
    const handleServiceConnected = () => {
      console.log('[App] Service connected');
      setAppState(prev => ({ ...prev, serviceConnected: true, error: null }));
    };

    const handleServiceDisconnected = () => {
      console.log('[App] Service disconnected');
      setAppState(prev => ({ ...prev, serviceConnected: false }));
    };

    const handleServiceError = (error: any) => {
      console.error('[App] Service error:', error);
      setAppState(prev => ({ ...prev, error: error.message || 'Service error' }));
    };

    // Listen for errors
    const unsubscribeError = electronAPIRef.current.onError((error) => {
      console.error('[App] Error:', error);
      setAppState(prev => ({ ...prev, error: error.message || 'Unknown error' }));
    });

    return () => {
      unsubscribePresence();
      unsubscribeError();
    };
  }, []);

  const handleSettingsUpdate = async (newConfig: Partial<AppConfig>) => {
    try {
      if (electronAPIRef.current) {
        await electronAPIRef.current.updateSettings(newConfig);
        setAppState(prev => ({
          ...prev,
          config: { ...prev.config, ...newConfig },
        }));
      }
    } catch (err) {
      console.error('[App] Error updating settings:', err);
      setAppState(prev => ({ ...prev, error: 'Failed to update settings' }));
    }
  };

  const handlePrivacyModeToggle = async (active: boolean) => {
    try {
      if (electronAPIRef.current) {
        await electronAPIRef.current.setPrivacyMode(active);
        setAppState(prev => ({
          ...prev,
          privacyModeActive: active,
          config: { ...prev.config, privacyModeActive: active },
        }));
      }
    } catch (err) {
      console.error('[App] Error toggling privacy mode:', err);
    }
  };

  const shouldHideNotifications = () => {
    if (appState.config.privacyModeActive) return true;

    const { status } = appState.presence;
    return status === 'no_face' || status === 'unknown_detected' || status === 'multiple_faces' || status === 'error';
  };

  return (
    <div className="app">
      <Page 
        appState={appState}
        onSettingsUpdate={handleSettingsUpdate}
        onPrivacyModeToggle={handlePrivacyModeToggle}
      />
    </div>
  );
};

export default App;
