from __future__ import annotations
import logging
from typing import List, Dict, Any, Tuple, Optional

from face_embeddings import FaceEmbeddingsManager

logger = logging.getLogger(__name__)

# Lazy loading for computer vision libraries to prevent crashes on startup
# in headless environments without X11/GUI libraries.
cv2 = None
np = None

def _get_cv2():
    global cv2
    if cv2 is None:
        import cv2 as _cv2
        cv2 = _cv2
    return cv2

def _get_np():
    global np
    if np is None:
        import numpy as _np
        np = _np
    return np


class MultiFaceProcessor:
    """Process and identify multiple faces in a frame."""

    def __init__(
        self,
        embeddings_manager: FaceEmbeddingsManager,
        sensitivity: float = 0.8,
        min_face_size: int = 30,
    ):
        """
        Initialize multi-face processor.

        Args:
            embeddings_manager: Face embeddings manager instance
            sensitivity: Detection sensitivity (0-1, higher = stricter)
            min_face_size: Minimum face size to consider valid (pixels)
        """
        _cv2 = _get_cv2()
        self.embeddings_manager = embeddings_manager
        self.sensitivity = sensitivity
        self.min_face_size = min_face_size
        self.face_cascade = _cv2.CascadeClassifier(
            _cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        logger.info(f"[MultiFace] Initialized with sensitivity: {sensitivity:.2f}")

    def detect_faces(self, frame: Any) -> List[Dict[str, Any]]:
        """
        Detect all faces in frame and identify them.

        Args:
            frame: Image frame in RGB format (numpy.ndarray)

        Returns:
            List of detected face dictionaries with position and identity
        """
        _cv2 = _get_cv2()
        detected_faces = []

        try:
            # Convert to grayscale for face detection
            _cv2 = _get_cv2()
            gray = _cv2.cvtColor(frame, _cv2.COLOR_RGB2GRAY)
            gray_eq = _cv2.equalizeHist(gray)

            # Detect faces using Haar Cascade
            faces = self.face_cascade.detectMultiScale(
                gray_eq,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(self.min_face_size, self.min_face_size),
            )

            logger.debug(f"[MultiFace] Detected {len(faces)} face(s)")

            # Process each detected face
            for idx, face in enumerate(faces):
                x, y, w, h = face

                # Validate face size
                if w < self.min_face_size or h < self.min_face_size:
                    continue

                # Extract face region
                face_region = frame[y:y+h, x:x+w]

                # Recognize the face
                is_registered, face_id, confidence = self.embeddings_manager.recognize_face(
                    frame,
                    tolerance=1.0 - self.sensitivity
                )

                face_info = {
                    'id': f'face_{idx}',
                    'position': {
                        'x': int(x),
                        'y': int(y),
                        'width': int(w),
                        'height': int(h),
                    },
                    'isRegisteredUser': is_registered,
                    'registeredFaceId': face_id if is_registered else None,
                    'confidence': float(confidence),
                }

                detected_faces.append(face_info)

                if is_registered:
                    logger.info(
                        f"[MultiFace] Face {idx}: Registered user '{face_id}' "
                        f"(confidence: {confidence:.2f})"
                    )
                else:
                    logger.warning(
                        f"[MultiFace] Face {idx}: Unknown person "
                        f"(confidence: {confidence:.2f})"
                    )

        except Exception as e:
            logger.error(f"[MultiFace] Error detecting faces: {e}")

        return detected_faces

    def analyze_presence(self, detected_faces: List[Dict[str, Any]], attention_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Analyze presence based on detected faces and attention data.

        Returns presence status, face count, and whether any unknown faces are present.

        Args:
            detected_faces: List of detected faces from detect_faces()
            attention_data: List of attention data corresponding to detected faces or overall scene

        Returns:
            Presence analysis dictionary
        """
        face_count = len(detected_faces)
        registered_count = sum(1 for f in detected_faces if f['isRegisteredUser'])
        unknown_count = face_count - registered_count

        # Map faces to attention data to check if strangers are looking
        stranger_looking_at_screen = False
        if unknown_count > 0 and attention_data:
            for face in detected_faces:
                if not face['isRegisteredUser']:
                    # Find closest attention box (simple heuristic)
                    fx, fy = face['position']['x'] + face['position']['width']/2, face['position']['y'] + face['position']['height']/2
                    for att in attention_data:
                        if 'box_hint_center' in att:
                            ax, ay = att['box_hint_center']
                            if abs(fx - ax) < 150 and abs(fy - ay) < 150: # roughly matches
                                if att['status'] == 'looking':
                                    stranger_looking_at_screen = True
                                    break
                    # If no attention mapping available, assume worst case for unknown faces
                    if not attention_data:
                        stranger_looking_at_screen = True

        analysis: Dict[str, Any] = {
            'face_count': face_count,
            'registered_count': registered_count,
            'unknown_count': unknown_count,
            'has_unknown_faces': unknown_count > 0,
            'all_registered': unknown_count == 0 and face_count > 0,
            'stranger_looking': stranger_looking_at_screen,
        }

        # Determine presence status
        if face_count == 0:
            status = 'no_face'
        elif face_count > 1 and stranger_looking_at_screen:
            status = 'privacy_mode_active'  # gaze-based shoulder surfing
        elif face_count > 1:
            status = 'multiple_faces' # safe, they are not looking
        elif unknown_count > 0:
            status = 'unknown_user'
        elif registered_count > 0:
            status = 'face_detected'
        else:
            status = 'error'

        analysis['status'] = status
        return analysis

    def should_hide_notifications(
        self,
        detected_faces: List[Dict[str, Any]],
        allow_multiple_registered: bool = False
    ) -> Tuple[bool, str]:
        """
        Determine if notifications should be hidden based on detected faces.

        Rules:
        - Hide if no faces detected (privacy concern)
        - Hide if any unknown face detected (shoulder surfing risk)
        - Hide if multiple faces detected (unless all registered and allowed)
        - Show only if all detected faces are registered users

        Args:
            detected_faces: List of detected faces
            allow_multiple_registered: Allow multiple registered users to see notifications

        Returns:
            Tuple of (should_hide: bool, reason: str)
        """
        face_count = len(detected_faces)
        unknown_count = sum(1 for f in detected_faces if not f['isRegisteredUser'])

        # No face detected - err on privacy side
        if face_count == 0:
            return True, 'no_face_detected'

        # Multiple faces detected (Strict shoulder surfing protection)
        if face_count > 1:
            return True, f'shoulder_surfing_{face_count}_faces'

        # Any unknown face detected
        if unknown_count > 0:
            return True, 'unknown_face_detected'

        # Single registered face
        return False, 'registered_user_only'

    def get_status_message(self, analysis: Dict[str, Any]) -> str:
        """Get human-readable status message."""
        status = analysis['status']

        if status == 'no_face':
            return 'No face detected. Notifications hidden for privacy.'
        elif status == 'user_detected':
            if analysis['face_count'] > 1:
                return (
                    f"Multiple registered users detected ({analysis['face_count']}). "
                    "Notifications visible."
                )
            else:
                return 'Registered user detected. Notifications visible.'
        elif status == 'unknown_detected':
            return 'Unknown person detected. Notifications hidden for privacy.'
        elif status == 'shoulder_surfing_active':
            return (
                f"Multiple faces detected ({analysis['face_count']}). "
                "Stranger is paying attention to your screen! Shield active."
            )
        elif status == 'multiple_faces_safe':
            return (
                f"Multiple persons present, but focusing elsewhere. "
                "Notifications visible."
            )
        else:
            return 'Error detecting faces.'

