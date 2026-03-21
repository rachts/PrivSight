/**
 * Shared types for Electron-Python IPC communication (v2.0)
 */

export type PresenceStatus = 
  | 'user_detected'      // Registered user detected
  | 'unknown_detected'   // Unknown face detected
  | 'multiple_faces'     // Multiple faces detected
  | 'no_face'           // No face detected
  | 'no_camera'         // Camera unavailable
  | 'error';            // Error occurred

export type AttentionStatus = 'looking' | 'not_looking' | 'uncertain';

export type NotificationSensitivity = 'public' | 'moderate' | 'sensitive';

export interface FaceInfo {
  id: string;
  position: { x: number; y: number; width: number; height: number };
  isRegisteredUser: boolean;
  registeredFaceId?: string;
  confidence: number;
  headPose?: { pitch: number; yaw: number; roll: number };
}

export interface AttentionData {
  status: AttentionStatus;
  gazeX?: number;  // Normalized gaze direction (-1 to 1)
  gazeY?: number;
  headRotation?: { x: number; y: number; z: number };
  eyesOpen?: boolean;
  confidence?: number;
}

export interface NotificationRule {
  appName: string;
  sensitivity: NotificationSensitivity;
  allowInPrivacy: boolean;
  custom?: boolean;
}

export interface PerformanceData {
  cpuUsage: number;           // Percentage 0-100
  memoryUsage: number;        // MB
  processingTime: number;     // ms per frame
  frameSkipRate: number;      // 0-1 ratio of skipped frames
  fps: number;                // Actual frames processed per second
}

export interface PresenceUpdate {
  status: PresenceStatus;
  timestamp: number;
  confidence?: number;         // 0-1 confidence level for face detection
  detectedFaces?: number;      // Number of faces detected
  
  // v2.0 additions
  faces?: FaceInfo[];          // Detailed multi-face information
  attention?: AttentionData;   // Gaze and head pose data
  performanceMetrics?: PerformanceData;
  framePreview?: string;       // Base64 JPEG frame
}

export interface IpcMessage {
  type: 'presence_update' | 'health_check' | 'command' | 'error' | 'frame_stream';
  payload: any;
  id?: string;
}

export interface HealthCheck {
  alive: boolean;
  timestamp: number;
}

export interface AppConfig {
  sensitivity: number;          // 0-100, face detection confidence threshold
  updateFrequency: number;      // ms between updates
  blurIntensity: number;        // 0-100, notification blur amount
  autoStart: boolean;
  privacyModeActive: boolean;
  
  // v2.0 additions
  enableAttentionDetection?: boolean;
  enableShoulderSurfingAlert?: boolean;
  enableLivePreview?: boolean;
  previewFrameRate?: number;    // 5-30 fps for preview
  performanceTarget?: number;   // Target CPU usage %
}

export interface FaceRegistration {
  id: string;
  name: string;
  registeredAt: number;
  embeddingsPath: string;
}

export interface DetectionResult {
  faceDetected: boolean;
  confidence: number;
  isRegisteredUser: boolean;
  faceCount: number;
  processingTime: number;
}

// Frame streaming for live preview
export interface FrameStreamMessage {
  type: 'frame';
  data: string; // Base64 JPEG
  width: number;
  height: number;
  timestamp: number;
  frameNumber: number;
}
