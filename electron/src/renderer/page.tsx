import React, { useState, useEffect } from 'react';
import type { PresenceUpdate, AttentionData, PerformanceData, FaceInfo, AppConfig } from '../../shared/types';
import MainWindow from './components/MainWindow';
import VideoPreview from './components/VideoPreview';
import AttentionIndicator from './components/AttentionIndicator';
import MultiUserAlert from './components/MultiUserAlert';
import NotificationFilter from './components/NotificationFilter';
import PerformanceMonitor from './components/PerformanceMonitor';
import NotificationOverlay from './components/NotificationOverlay';
import '../styles/page.css';

interface PageProps {
  appState: {
    presence: any;
    config: AppConfig;
    privacyModeActive: boolean;
    serviceConnected: boolean;
    error: string | null;
  };
  onSettingsUpdate: (config: Partial<AppConfig>) => Promise<void>;
  onPrivacyModeToggle: (active: boolean) => Promise<void>;
}

interface PageState {
  presenceData: PresenceUpdate | null;
  showVideoPreview: boolean;
  showAttentionIndicator: boolean;
  showMultiUserAlert: boolean;
  showPerformanceMonitor: boolean;
  activeTab: 'dashboard' | 'preview' | 'filter' | 'performance' | 'settings';
}

const Page: React.FC<PageProps> = ({ appState, onSettingsUpdate, onPrivacyModeToggle }) => {
  const [pageState, setPageState] = useState<PageState>({
    presenceData: null,
    showVideoPreview: false,
    showAttentionIndicator: false,
    showMultiUserAlert: false,
    showPerformanceMonitor: false,
    activeTab: 'dashboard',
  });

  const handlePresenceUpdate = (data: PresenceUpdate) => {
    setPageState(prev => ({
      ...prev,
      presenceData: data,
      showAttentionIndicator: !!data.attention,
      showMultiUserAlert: data.detectedFaces && data.detectedFaces > 1,
      showPerformanceMonitor: !!data.performanceMetrics,
    }));
  };

  const handleTabChange = (tab: PageState['activeTab']) => {
    setPageState(prev => ({ ...prev, activeTab: tab }));
    
    // Enable preview when switching to preview tab
    if (tab === 'preview') {
      setPageState(prev => ({ ...prev, showVideoPreview: true }));
    }
  };

  return (
    <div className="page-container">
      {/* Top Navigation */}
      <nav className="page-nav">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${pageState.activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${pageState.activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => handleTabChange('preview')}
          >
            Camera
          </button>
          <button
            className={`nav-tab ${pageState.activeTab === 'filter' ? 'active' : ''}`}
            onClick={() => handleTabChange('filter')}
          >
            Notifications
          </button>
          <button
            className={`nav-tab ${pageState.activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => handleTabChange('performance')}
          >
            Performance
          </button>
          <button
            className={`nav-tab ${pageState.activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            Settings
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <div className="page-content">
        {pageState.activeTab === 'dashboard' && (
          <div className="tab-content">
            <MainWindow 
              appState={appState}
              onPresenceUpdate={handlePresenceUpdate}
              onSettingsUpdate={onSettingsUpdate}
              onPrivacyModeToggle={onPrivacyModeToggle}
            />
            
            {/* Inline alerts and indicators */}
            <div className="dashboard-widgets">
              {pageState.showMultiUserAlert && pageState.presenceData?.faces && (
                <MultiUserAlert
                  detectedFaces={pageState.presenceData.faces}
                  totalFaces={pageState.presenceData.detectedFaces || 0}
                />
              )}
              
              {pageState.showAttentionIndicator && pageState.presenceData?.attention && (
                <AttentionIndicator
                  status={pageState.presenceData.attention.status}
                  gazeX={pageState.presenceData.attention.gazeX}
                  gazeY={pageState.presenceData.attention.gazeY}
                  eyesOpen={pageState.presenceData.attention.eyesOpen}
                />
              )}
            </div>
          </div>
        )}

        {pageState.activeTab === 'preview' && (
          <div className="tab-content">
            <VideoPreview
              frameData={pageState.presenceData?.framePreview}
              enabled={pageState.showVideoPreview}
              detectedFaces={pageState.presenceData?.faces || []}
            />
          </div>
        )}

        {pageState.activeTab === 'filter' && (
          <div className="tab-content">
            <NotificationFilter presenceData={pageState.presenceData} />
          </div>
        )}

        {pageState.activeTab === 'performance' && (
          <div className="tab-content">
            <PerformanceMonitor
              metrics={pageState.presenceData?.performanceMetrics}
            />
          </div>
        )}

        {pageState.activeTab === 'settings' && (
          <div className="tab-content">
            <div className="settings-panel">
              <h2>Settings & Configuration</h2>
              <p>Advanced settings coming soon...</p>
              {/* Settings will be populated from MainWindow settings */}
            </div>
          </div>
        )}
      </div>

      {/* Notification Overlay (always present) */}
      <NotificationOverlay show={true} />
    </div>
  );
};

export default Page;
