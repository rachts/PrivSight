export interface AiStatus {
  status: 'no_face' | 'face_detected' | 'multiple_faces' | 'unknown_user' | 'privacy_mode_active';
  confidence: number;
  facesCount: number;
}
