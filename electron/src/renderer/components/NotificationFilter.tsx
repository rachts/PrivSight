import React, { useState, useEffect } from 'react';
import type { NotificationSensitivity, PresenceUpdate } from '../../../shared/types';
import '../styles/NotificationFilter.css';

interface NotificationFilterProps {
  classifications?: Record<string, string[]>;
  onAppSensitivityChange?: (appName: string, sensitivity: NotificationSensitivity) => void;
  presenceData?: PresenceUpdate | null;
}

const NotificationFilter: React.FC<NotificationFilterProps> = ({
  classifications = { sensitive: [], moderate: [], public: [] },
  onAppSensitivityChange,
  presenceData,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('sensitive');
  const [customApp, setCustomApp] = useState('');
  const [customSensitivity, setCustomSensitivity] = useState<NotificationSensitivity>('moderate');

  const getSensitivityColor = (sensitivity: string): string => {
    switch (sensitivity) {
      case 'sensitive':
        return '#ef4444';
      case 'moderate':
        return '#f59e0b';
      case 'public':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getSensitivityIcon = (sensitivity: string): string => {
    switch (sensitivity) {
      case 'sensitive':
        return '🔒';
      case 'moderate':
        return '⚠️';
      case 'public':
        return '🌍';
      default:
        return '❓';
    }
  };

  const getSensitivityDescription = (sensitivity: string): string => {
    switch (sensitivity) {
      case 'sensitive':
        return 'Hidden in privacy mode (banking, email, passwords)';
      case 'moderate':
        return 'Hidden in strict privacy (chat, social media)';
      case 'public':
        return 'Always visible (news, media, general apps)';
      default:
        return 'Unknown classification';
    }
  };

  const handleAddApp = () => {
    if (customApp.trim()) {
      onAppSensitivityChange?.(customApp, customSensitivity);
      setCustomApp('');
      setCustomSensitivity('moderate');
    }
  };

  const handleAppClick = (appName: string, oldSensitivity: string) => {
    // Cycle through sensitivities
    const sensitivities: NotificationSensitivity[] = ['sensitive', 'moderate', 'public'];
    const currentIndex = sensitivities.indexOf(oldSensitivity as NotificationSensitivity);
    const nextSensitivity = sensitivities[(currentIndex + 1) % sensitivities.length];
    onAppSensitivityChange?.(appName, nextSensitivity);
  };

  return (
    <div className="notification-filter">
      <div className="filter-header">
        <h3>Notification Filtering</h3>
        <p className="filter-subtitle">Control which notifications appear in privacy mode</p>
      </div>

      <div className="filter-content">
        {/* Classification Sections */}
        <div className="classifications">
          {(['sensitive', 'moderate', 'public'] as const).map((level) => {
            const apps = classifications[level] || [];
            const isExpanded = expandedSection === level;

            return (
              <div key={level} className="classification-section">
                <div
                  className="section-header"
                  onClick={() => setExpandedSection(isExpanded ? null : level)}
                >
                  <span className="section-icon">{getSensitivityIcon(level)}</span>
                  <div className="section-title">
                    <span className="title">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    <span className="count">({apps.length})</span>
                  </div>
                  <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>

                {isExpanded && (
                  <div className="section-content">
                    <p className="section-description">{getSensitivityDescription(level)}</p>
                    {apps.length > 0 ? (
                      <div className="apps-grid">
                        {apps.map((app) => (
                          <div
                            key={app}
                            className="app-item"
                            onClick={() => handleAppClick(app, level)}
                            title="Click to change sensitivity"
                          >
                            <span className="app-name">{app}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-apps">No apps classified</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Custom App */}
        <div className="custom-app-section">
          <h4>Add Custom App Classification</h4>
          <div className="custom-app-form">
            <input
              type="text"
              placeholder="App name (e.g., MyApp)"
              value={customApp}
              onChange={(e) => setCustomApp(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddApp()}
            />
            <select
              value={customSensitivity}
              onChange={(e) => setCustomSensitivity(e.target.value as NotificationSensitivity)}
            >
              <option value="sensitive">Sensitive</option>
              <option value="moderate">Moderate</option>
              <option value="public">Public</option>
            </select>
            <button onClick={handleAddApp}>Add</button>
          </div>
        </div>

        {/* Tips */}
        <div className="filter-tips">
          <h4>Tips</h4>
          <ul>
            <li>Click any app to cycle through sensitivity levels</li>
            <li>Sensitive apps are hidden when shoulder surfing is detected</li>
            <li>Use this to fine-tune privacy for your workflow</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationFilter;
