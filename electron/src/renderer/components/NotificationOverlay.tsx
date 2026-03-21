import React, { useEffect, useState } from 'react';
import type { PresenceStatus } from '../../../shared/types';
import './NotificationOverlay.css';

interface NotificationOverlayProps {
  blurIntensity: number;
  reason: PresenceStatus;
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({
  blurIntensity,
  reason,
}) => {
  const [displayReason, setDisplayReason] = useState<string>('');

  useEffect(() => {
    const reasons: Record<PresenceStatus, string> = {
      no_face: 'No face detected - Notifications hidden',
      unknown_detected: 'Unknown person detected - Notifications hidden',
      multiple_faces: 'Multiple people detected - Notifications hidden',
      error: 'Detection error - Notifications hidden',
      user_detected: '',
      privacy_mode: 'Privacy Mode active - Notifications hidden',
    };

    setDisplayReason(reasons[reason] || '');
  }, [reason]);

  const blurValue = Math.max(2, blurIntensity / 5);

  return (
    <div
      className="notification-overlay"
      style={{
        backdropFilter: `blur(${blurValue}px)`,
      }}
    >
      {displayReason && (
        <div className="overlay-message">
          <div className="lock-icon">🔒</div>
          <p className="message-text">{displayReason}</p>
        </div>
      )}

      {/* Decorative elements */}
      <div className="overlay-particle particle-1"></div>
      <div className="overlay-particle particle-2"></div>
      <div className="overlay-particle particle-3"></div>
    </div>
  );
};

export default NotificationOverlay;
