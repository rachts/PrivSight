import { AiStatus } from '../types/aiStatus';

class AiStatusService {
  private currentStatus: AiStatus = {
    status: 'no_face',
    confidence: 0,
    facesCount: 0
  };

  updateStatus(status: AiStatus['status'], confidence: number, facesCount: number) {
    this.currentStatus = { status, confidence, facesCount };
  }

  getStatus() {
    return this.currentStatus;
  }

  isPrivacyRisk() {
    return ['privacy_mode_active', 'multiple_faces', 'unknown_user'].includes(this.currentStatus.status);
  }
}

export const aiStatusService = new AiStatusService();
