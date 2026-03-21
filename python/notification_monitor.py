"""
Notification monitoring and presence detection logic.
"""

import logging
from typing import Dict, Any, Optional

import cv2
import numpy as np

from face_embeddings import FaceEmbeddingsManager

logger = logging.getLogger(__name__)


class NotificationMonitor:
    """Monitor presence and determine notification visibility."""

    def __init__(
        self,
        embeddings_manager: FaceEmbeddingsManager,
        sensitivity: float = 0.8,
        min_face_size: int = 30,
    ):
        """
        Initialize notification monitor.

        Args:
            embeddings_manager: Face embeddings manager instance
            sensitivity: Detection sensitivity (0-1, higher = stricter)
            min_face_size: Minimum face size to consider valid (pixels)
        """
        self.embeddings_manager = embeddings_manager
        self.sensitivity = sensitivity
        self.min_face_size = min_face_size
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

        logger.info(f"[Monitor] Initialized with sensitivity: {sensitivity:.2f}")

    def detect_presence(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Detect presence and recognized faces in frame.

        Args:
            frame: Image frame in RGB format

        Returns:
            Detection result with status, confidence, and face count
        """
        result = {
            'error': None,
            'face_count': 0,
            'is_registered_user': False,
            'confidence': 0.0,
            'processing_time': 0,
            'faces': [],
        }

        try:
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            gray_eq = cv2.equalizeHist(gray)

            # Detect faces using Haar Cascade
            faces = self.face_cascade.detectMultiScale(
                gray_eq,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(self.min_face_size, self.min_face_size),
            )

            result['face_count'] = len(faces)

            # Process detected faces
            if len(faces) == 0:
                logger.debug("[Monitor] No faces detected")
                return result

            if len(faces) > 1:
                logger.warning(f"[Monitor] Multiple faces detected: {len(faces)}")
                return result

            # Single face detected - check if registered
            face = faces[0]
            x, y, w, h = face

            # Validate face size
            if w < self.min_face_size or h < self.min_face_size:
                logger.debug("[Monitor] Detected face too small")
                return result

            # Recognize the face
            is_registered, face_id, confidence = self.embeddings_manager.recognize_face(
                frame,
                tolerance=1.0 - self.sensitivity
            )

            result['is_registered_user'] = is_registered
            result['confidence'] = confidence
            result['faces'] = [{
                'x': int(x),
                'y': int(y),
                'w': int(w),
                'h': int(h),
                'registered': is_registered,
                'face_id': face_id,
                'confidence': confidence,
            }]

            if is_registered:
                logger.info(f"[Monitor] Registered user detected (ID: {face_id}, confidence: {confidence:.2f})")
            else:
                logger.warning(f"[Monitor] Unknown face detected (confidence: {confidence:.2f})")

        except Exception as e:
            logger.error(f"[Monitor] Error in detection: {e}")
            result['error'] = str(e)

        return result

    def should_hide_notifications(self, detection_result: Dict[str, Any]) -> bool:
        """
        Determine if notifications should be hidden based on detection.

        Rules:
        - Hide if error in detection
        - Hide if no face detected (privacy concern)
        - Hide if multiple faces detected (shoulder surfing risk)
        - Hide if unknown face detected
        - Show if registered user detected

        Args:
            detection_result: Result from detect_presence()

        Returns:
            True if notifications should be hidden
        """
        if detection_result['error']:
            return True

        face_count = detection_result['face_count']

        # No face detected - err on privacy side, hide
        if face_count == 0:
            return True

        # Multiple faces - potential shoulder surfing
        if face_count > 1:
            return True

        # Check if registered user
        if detection_result['is_registered_user']:
            return False  # Show notifications for registered user

        # Unknown face detected
        return True

    def get_privacy_status(self, detection_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get human-readable privacy status.

        Args:
            detection_result: Result from detect_presence()

        Returns:
            Dictionary with status, message, and recommendations
        """
        face_count = detection_result['face_count']
        is_registered = detection_result['is_registered_user']

        if detection_result['error']:
            return {
                'status': 'error',
                'message': f"Detection error: {detection_result['error']}",
                'notifications_hidden': True,
            }

        if face_count == 0:
            return {
                'status': 'no_face',
                'message': 'No face detected. Notifications hidden for privacy.',
                'notifications_hidden': True,
            }

        if face_count > 1:
            return {
                'status': 'multiple_faces',
                'message': f'Multiple faces detected ({face_count}). Potential shoulder surfing. Notifications hidden.',
                'notifications_hidden': True,
            }

        if is_registered:
            return {
                'status': 'user_detected',
                'message': 'Registered user detected. Notifications visible.',
                'notifications_hidden': False,
                'confidence': detection_result['confidence'],
            }

        return {
            'status': 'unknown_detected',
            'message': 'Unknown person detected. Notifications hidden for privacy.',
            'notifications_hidden': True,
            'confidence': detection_result['confidence'],
        }
