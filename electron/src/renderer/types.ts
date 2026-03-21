import type { PresenceUpdate, AppConfig, PresenceStatus } from '../../shared/types';

export interface ElectronAPI {
  onPresenceUpdate: (callback: (data: PresenceUpdate) => void) => void;
  offPresenceUpdate: () => void;
  onHealthCheck: (callback: (data: any) => void) => void;
  getSettings: () => Promise<AppConfig>;
  updateSettings: (config: Partial<AppConfig>) => Promise<void>;
  setPrivacyMode: (active: boolean) => Promise<void>;
  minimizeWindow: () => void;
  closeWindow: () => void;
  onError: (callback: (error: any) => void) => void;
  offError: () => void;
}

export interface PresenceState {
  status: PresenceStatus;
  timestamp: number;
  confidence: number;
  detectedFaces: number;
}

export interface AppState {
  presence: PresenceState;
  config: AppConfig;
  privacyModeActive: boolean;
  serviceConnected: boolean;
  error: string | null;
}
