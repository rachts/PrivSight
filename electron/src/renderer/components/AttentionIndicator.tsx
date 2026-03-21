import React from 'react';
import type { AttentionStatus } from '../../../shared/types';
import '../styles/AttentionIndicator.css';

interface AttentionIndicatorProps {
  status?: AttentionStatus;
  confidence?: number;
  headRotation?: { x: number; y: number; z: number };
  eyesOpen?: boolean;
}

const AttentionIndicator: React.FC<AttentionIndicatorProps> = ({
  status = 'uncertain',
  confidence = 0,
  headRotation = { x: 0, y: 0, z: 0 },
  eyesOpen = true,
}) => {
  const getStatusColor = (): string => {
    switch (status) {
      case 'looking':
        return '#10b981'; // green
      case 'not_looking':
        return '#ef4444'; // red
      case 'uncertain':
      default:
        return '#f59e0b'; // amber
    }
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case 'looking':
        return 'User Looking At Screen';
      case 'not_looking':
        return 'User Not Looking';
      case 'uncertain':
      default:
        return 'Attention Uncertain';
    }
  };

  const headPoseLabel = () => {
    const { x: pitch, y: yaw, z: roll } = headRotation;
    if (Math.abs(yaw) > 30) return 'Head Turned Away';
    if (Math.abs(pitch) > 20) return 'Head Tilted';
    if (Math.abs(roll) > 15) return 'Head Rotated';
    return 'Head Forward';
  };

  return (
    <div className="attention-indicator">
      <div className="indicator-header">
        <h3>Attention Detection</h3>
      </div>

      <div className="indicator-content">
        {/* Status Circle */}
        <div className="status-circle-container">
          <div
            className="status-circle"
            style={{ backgroundColor: getStatusColor() }}
          >
            <div className="status-pulse" style={{ borderColor: getStatusColor() }} />
          </div>
          <div className="status-text">{getStatusLabel()}</div>
        </div>

        {/* Confidence Bar */}
        <div className="confidence-section">
          <div className="confidence-label">
            <span>Confidence</span>
            <span className="confidence-value">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="confidence-bar-container">
            <div
              className="confidence-bar"
              style={{ width: `${confidence * 100}%`, backgroundColor: getStatusColor() }}
            />
          </div>
        </div>

        {/* Details */}
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Head Pose</span>
            <span className="detail-value">{headPoseLabel()}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Eyes</span>
            <span className="detail-value">{eyesOpen ? 'Open' : 'Closed'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Rotation</span>
            <span className="detail-value">
              {`P:${headRotation.x.toFixed(0)}° Y:${headRotation.y.toFixed(0)}° R:${headRotation.z.toFixed(0)}°`}
            </span>
          </div>
        </div>

        {/* Privacy Impact */}
        {status === 'not_looking' && (
          <div className="privacy-impact" style={{ borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <span className="icon">⚠️</span>
            <span>Notifications will be hidden while you're not looking</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttentionIndicator;
