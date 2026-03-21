import React from 'react';
import type { FaceInfo } from '../../../shared/types';
import '../styles/MultiUserAlert.css';

interface MultiUserAlertProps {
  faceCount: number;
  faces?: FaceInfo[];
  showAlert?: boolean;
}

const MultiUserAlert: React.FC<MultiUserAlertProps> = ({
  faceCount,
  faces = [],
  showAlert = faceCount > 1,
}) => {
  const registeredCount = faces.filter(f => f.isRegisteredUser).length;
  const unknownCount = faceCount - registeredCount;

  if (!showAlert || faceCount <= 1) {
    return null;
  }

  const isShoulderSurfing = unknownCount > 0;

  return (
    <div className={`multi-user-alert ${isShoulderSurfing ? 'warning' : 'info'}`}>
      <div className="alert-header">
        <span className="alert-icon">👥</span>
        <span className="alert-title">
          {isShoulderSurfing ? 'Shoulder Surfing Detected!' : `${faceCount} Users Detected`}
        </span>
      </div>

      <div className="alert-content">
        <div className="face-count-summary">
          <div className="count-item">
            <span className="count-label">Total Faces</span>
            <span className="count-value">{faceCount}</span>
          </div>
          <div className="count-item">
            <span className="count-label">Registered</span>
            <span className="count-value registered">{registeredCount}</span>
          </div>
          <div className="count-item">
            <span className="count-label">Unknown</span>
            <span className="count-value unknown">{unknownCount}</span>
          </div>
        </div>

        {isShoulderSurfing && (
          <div className="shoulder-surfing-warning">
            <span className="warning-icon">⚠️</span>
            <div className="warning-text">
              <p className="warning-title">Unknown person(s) detected!</p>
              <p className="warning-description">Notifications are hidden for privacy protection.</p>
            </div>
          </div>
        )}

        {faces.length > 0 && (
          <div className="faces-list">
            <h4>Detected Faces:</h4>
            <div className="faces-grid">
              {faces.map((face, idx) => (
                <div key={face.id} className="face-item">
                  <div className={`face-badge ${face.isRegisteredUser ? 'registered' : 'unknown'}`}>
                    {face.isRegisteredUser ? '✓' : '?'}
                  </div>
                  <div className="face-info">
                    <span className="face-label">
                      {face.isRegisteredUser ? (face.registeredFaceId || 'Registered') : 'Unknown'}
                    </span>
                    <span className="face-confidence">
                      {(face.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiUserAlert;
