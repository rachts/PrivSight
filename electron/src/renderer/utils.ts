import type { PresenceStatus } from '../../shared/types';

export const getStatusColor = (status: PresenceStatus): string => {
  switch (status) {
    case 'user_detected':
      return 'green';
    case 'unknown_detected':
    case 'multiple_faces':
    case 'error':
      return 'red';
    case 'no_face':
      return 'yellow';
    case 'no_camera':
      return 'gray';
    default:
      return 'gray';
  }
};

export const getStatusMessage = (status: PresenceStatus): string => {
  switch (status) {
    case 'user_detected':
      return '✓ Registered User Detected';
    case 'unknown_detected':
      return '⚠ Unknown Person Detected';
    case 'multiple_faces':
      return '⚠ Multiple People Detected';
    case 'no_face':
      return '○ No Face Detected';
    case 'no_camera':
      return '✕ Camera Unavailable';
    case 'error':
      return '✕ Detection Error';
    default:
      return '○ Checking...';
  }
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatUptime = (startTime: number): string => {
  const now = Date.now();
  const diff = Math.floor((now - startTime) / 1000);

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};
