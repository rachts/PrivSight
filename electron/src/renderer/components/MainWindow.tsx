import React, { useState } from 'react';
import type { AppState } from '../types';
import type { AppConfig, PresenceUpdate } from '../../../shared/types';
import { getStatusColor, getStatusMessage } from '../utils';
import './MainWindow.css';

interface MainWindowProps {
  appState: AppState;
  onSettingsUpdate: (config: Partial<AppConfig>) => void;
  onPrivacyModeToggle: (active: boolean) => void;
  onPresenceUpdate?: (data: PresenceUpdate) => void;
}

const MainWindow: React.FC<MainWindowProps> = ({
  appState,
  onSettingsUpdate,
  onPrivacyModeToggle,
  onPresenceUpdate,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const statusColor = getStatusColor(appState.presence.status);
  const statusMessage = getStatusMessage(appState.presence.status);

  const confidencePercent = Math.round(appState.presence.confidence * 100);

  return (
    <div className="main-window">
      {/* Header */}
      <div className="header">
        <h1 className="title">Privacy Protector</h1>
        <div className="header-controls">
          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.electronAPI?.minimizeWindow()}
            title="Minimize"
          >
            −
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.electronAPI?.closeWindow()}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Main Status Display */}
      <div className="status-panel">
        <div className={`status-indicator ${statusColor}`}>
          <div className="pulse"></div>
        </div>
        <div className="status-info">
          <h2 className="status-title">{statusMessage}</h2>
          <p className="status-subtitle">
            {appState.presence.detectedFaces === 0
              ? 'No faces detected'
              : `${appState.presence.detectedFaces} face${appState.presence.detectedFaces !== 1 ? 's' : ''} detected`}
          </p>
          {appState.presence.confidence > 0 && (
            <p className="confidence-text">
              Confidence: {confidencePercent}%
            </p>
          )}
        </div>
      </div>

      {/* Service Status */}
      <div className={`service-status ${appState.serviceConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {appState.serviceConnected ? 'Service Connected' : 'Service Disconnected'}
      </div>

      {/* Error Display */}
      {appState.error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {appState.error}
        </div>
      )}

      {/* Privacy Mode Toggle */}
      <div className="privacy-mode-section">
        <label className="privacy-label">
          <input
            type="checkbox"
            checked={appState.config.privacyModeActive}
            onChange={(e) => onPrivacyModeToggle(e.target.checked)}
            className="privacy-checkbox"
          />
          <span className="privacy-text">
            {appState.config.privacyModeActive ? '🔒 Privacy Mode Active' : '🔓 Privacy Mode Inactive'}
          </span>
        </label>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h3 className="settings-title">Settings</h3>

          {/* Sensitivity Slider */}
          <div className="setting-item">
            <label className="setting-label">
              Sensitivity: <span className="value">{appState.config.sensitivity}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={appState.config.sensitivity}
              onChange={(e) => onSettingsUpdate({ sensitivity: parseInt(e.target.value) })}
              className="slider"
            />
            <p className="setting-help">Higher = stricter face matching</p>
          </div>

          {/* Update Frequency */}
          <div className="setting-item">
            <label className="setting-label">
              Update Frequency: <span className="value">{appState.config.updateFrequency}ms</span>
            </label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={appState.config.updateFrequency}
              onChange={(e) => onSettingsUpdate({ updateFrequency: parseInt(e.target.value) })}
              className="slider"
            />
            <p className="setting-help">Lower = more responsive (uses more CPU)</p>
          </div>

          {/* Blur Intensity */}
          <div className="setting-item">
            <label className="setting-label">
              Blur Intensity: <span className="value">{appState.config.blurIntensity}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={appState.config.blurIntensity}
              onChange={(e) => onSettingsUpdate({ blurIntensity: parseInt(e.target.value) })}
              className="slider"
            />
            <p className="setting-help">Strength of notification blur effect</p>
          </div>

          {/* Auto Start Option */}
          <div className="setting-item checkbox-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={appState.config.autoStart}
                onChange={(e) => onSettingsUpdate({ autoStart: e.target.checked })}
                className="checkbox"
              />
              <span>Launch at system startup</span>
            </label>
          </div>

          <button
            className="btn btn-primary settings-close"
            onClick={() => setShowSettings(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default MainWindow;
