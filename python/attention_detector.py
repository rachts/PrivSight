from __future__ import annotations

import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

# Lazy loading for heavy CV libraries to prevent crashes in headless environments
cv2 = None
np = None
mp = None

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

def _get_mp():
    global mp
    if mp is None:
        try:
            import mediapipe as _mp
            mp = _mp
        except ImportError:
            logger.warning("[Attention] MediaPipe not available - attention detection disabled")
            return None
    return mp

def is_mediapipe_available():
    return _get_mp() is not None


class AttentionDetector:
    """Detect if user is paying attention to screen using gaze and head pose."""

    def __init__(self, enable: bool = True):
        """
        Initialize attention detector.

        Args:
            enable: Whether to enable attention detection
        """
        self.enabled = enable and is_mediapipe_available()
        self.face_mesh = None
        self.mp_drawing = None

        if self.enabled:
            try:
                _mp = _get_mp()
                self.face_mesh = _mp.solutions.face_mesh.FaceMesh(
                    static_image_mode=False,
                    max_num_faces=5,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5,
                )
                self.liveness_history = {} # face_id -> list of EARs
                logger.info("[Attention] MediaPipe Face Mesh initialized (Max 5 faces)")
            except Exception as e:
                logger.error(f"[Attention] Error initializing MediaPipe: {e}")
                self.enabled = False

    def detect_attention(self, frame: np.ndarray, face_boxes_hint: Optional[list] = None) -> list[Dict[str, Any]]:
        """
        Detect if users are looking at screen for multiple faces.

        Args:
            frame: Image frame in RGB format (H x W x 3)
            face_boxes_hint: Optional bounding boxes from cascade to map MediaPipe landmarks.

        Returns:
            List of Attention data dictionaries for each detected face.
        """
        if not self.enabled or self.face_mesh is None:
            return []

        try:
            # Get frame dimensions
            h, w, c = frame.shape

            # Process frame with MediaPipe
            results = self.face_mesh.process(frame)

            if not results.multi_face_landmarks or len(results.multi_face_landmarks) == 0:
                return []

            # Key landmark indices for attention detection
            RIGHT_EYE_INNER = 362
            RIGHT_EYE_OUTER = 263
            LEFT_EYE_INNER = 133
            LEFT_EYE_OUTER = 33

            attention_results = []
            _np = _get_np()
            
            for f_idx, landmarks in enumerate(results.multi_face_landmarks):
                # Extract key points (normalized 0-1)
                left_eye_inner = _np.array([landmarks.landmark[LEFT_EYE_INNER].x, landmarks.landmark[LEFT_EYE_INNER].y])
                left_eye_outer = _np.array([landmarks.landmark[LEFT_EYE_OUTER].x, landmarks.landmark[LEFT_EYE_OUTER].y])
                right_eye_inner = _np.array([landmarks.landmark[RIGHT_EYE_INNER].x, landmarks.landmark[RIGHT_EYE_INNER].y])
                right_eye_outer = _np.array([landmarks.landmark[RIGHT_EYE_OUTER].x, landmarks.landmark[RIGHT_EYE_OUTER].y])

                # Calculate gaze direction
                left_gaze_center = (left_eye_inner + left_eye_outer) / 2
                right_gaze_center = (right_eye_inner + right_eye_outer) / 2
                gaze_center = (left_gaze_center + right_gaze_center) / 2

                gaze_x = _np.clip((gaze_center[0] - 0.5) * 2, -1, 1)
                gaze_y = _np.clip((gaze_center[1] - 0.5) * 2, -1, 1)

                head_rotation = self._estimate_head_pose(landmarks)
                eyes_open, current_ear = self._detect_eyes_open(landmarks)

                # Liveness check via micro EAR variance over history
                # Assuming 15 fps processing, 45 frames ~ 3 seconds
                if f_idx not in self.liveness_history:
                    self.liveness_history[f_idx] = []
                self.liveness_history[f_idx].append(current_ear)
                if len(self.liveness_history[f_idx]) > 45:
                    self.liveness_history[f_idx].pop(0)

                is_live = True
                if len(self.liveness_history[f_idx]) >= 30:
                    ear_variance = _np.var(self.liveness_history[f_idx])
                    if ear_variance < 1e-5:
                        # Static image / spoof detected
                        is_live = False

                attention_results.append({
                    'status': self._classify_attention(gaze_x, gaze_y, head_rotation, eyes_open),
                    'gazeX': float(gaze_x),
                    'gazeY': float(gaze_y),
                    'headRotation': head_rotation,
                    'eyesOpen': eyes_open,
                    'isLive': is_live,
                    'confidence': 0.8,
                    'box_hint_center': (
                         (_np.min([l.x for l in landmarks.landmark]) + _np.max([l.x for l in landmarks.landmark])) / 2 * w,
                         (_np.min([l.y for l in landmarks.landmark]) + _np.max([l.y for l in landmarks.landmark])) / 2 * h
                    )
                })

            # Cleanup stale liveness histories
            active_ids = range(len(results.multi_face_landmarks))
            self.liveness_history = {k: v for k, v in self.liveness_history.items() if k in active_ids}

            return attention_results

        except Exception as e:
            logger.error(f"[Attention] Error detecting attention: {e}")
            return []

    def _estimate_head_pose(self, landmarks) -> Dict[str, float]:
        """
        Estimate head pose (pitch, yaw, roll) from landmarks.

        Args:
            landmarks: MediaPipe face landmarks

        Returns:
            Dictionary with x (pitch), y (yaw), z (roll) in degrees
        """
        try:
            # Key points for head pose estimation
            NOSE = 1
            CHIN = 152
            LEFT_EAR = 234
            RIGHT_EAR = 454
            LEFT_SHOULDER = 11
            RIGHT_SHOULDER = 12

            # Get 3D coordinates (MediaPipe includes z)
            _np = _get_np()
            nose = _np.array([landmarks.landmark[NOSE].x, landmarks.landmark[NOSE].y, landmarks.landmark[NOSE].z])
            chin = _np.array([landmarks.landmark[CHIN].x, landmarks.landmark[CHIN].y, landmarks.landmark[CHIN].z])
            left_ear = _np.array([landmarks.landmark[LEFT_EAR].x, landmarks.landmark[LEFT_EAR].y, landmarks.landmark[LEFT_EAR].z])
            right_ear = _np.array([landmarks.landmark[RIGHT_EAR].x, landmarks.landmark[RIGHT_EAR].y, landmarks.landmark[RIGHT_EAR].z])

            # Simple head pose estimation
            # Pitch: forward/backward tilt
            pitch = (chin[1] - nose[1]) * 90  # 90 degrees range
            pitch = _np.clip(pitch, -30, 30)

            # Yaw: left/right turn
            yaw = (right_ear[0] - left_ear[0]) * 90
            yaw = _np.clip(yaw, -45, 45)

            # Roll: head tilt
            roll = (right_ear[1] - left_ear[1]) * 90
            roll = _np.clip(roll, -30, 30)

            return {
                'x': float(pitch),  # pitch
                'y': float(yaw),    # yaw
                'z': float(roll),   # roll
            }

        except Exception as e:
            logger.debug(f"[Attention] Error estimating head pose: {e}")
            return {'x': 0, 'y': 0, 'z': 0}

    def _detect_eyes_open(self, landmarks) -> Tuple[bool, float]:
        """
        Detect if eyes are open based on eye aspect ratio.

        Args:
            landmarks: MediaPipe face landmarks

        Returns:
            Tuple of (is_open: bool, avg_ear: float)
        """
        try:
            # Eye aspect ratio landmarks
            LEFT_EYE_UP = 159
            LEFT_EYE_DOWN = 145
            RIGHT_EYE_UP = 386
            RIGHT_EYE_DOWN = 374
            LEFT_EYE_LEFT = 33
            LEFT_EYE_RIGHT = 133
            RIGHT_EYE_LEFT = 263
            RIGHT_EYE_RIGHT = 362

            # Calculate eye aspect ratio (EAR)
            _np = _get_np()
            left_vertical = _np.linalg.norm(
                _np.array([landmarks.landmark[LEFT_EYE_UP].x, landmarks.landmark[LEFT_EYE_UP].y]) -
                _np.array([landmarks.landmark[LEFT_EYE_DOWN].x, landmarks.landmark[LEFT_EYE_DOWN].y])
            )
            left_horizontal = _np.linalg.norm(
                _np.array([landmarks.landmark[LEFT_EYE_LEFT].x, landmarks.landmark[LEFT_EYE_LEFT].y]) -
                _np.array([landmarks.landmark[LEFT_EYE_RIGHT].x, landmarks.landmark[LEFT_EYE_RIGHT].y])
            )
            left_ear = left_vertical / left_horizontal if left_horizontal > 0 else 0

            right_vertical = _np.linalg.norm(
                _np.array([landmarks.landmark[RIGHT_EYE_UP].x, landmarks.landmark[RIGHT_EYE_UP].y]) -
                _np.array([landmarks.landmark[RIGHT_EYE_DOWN].x, landmarks.landmark[RIGHT_EYE_DOWN].y])
            )
            right_horizontal = _np.linalg.norm(
                _np.array([landmarks.landmark[RIGHT_EYE_LEFT].x, landmarks.landmark[RIGHT_EYE_LEFT].y]) -
                _np.array([landmarks.landmark[RIGHT_EYE_RIGHT].x, landmarks.landmark[RIGHT_EYE_RIGHT].y])
            )
            right_ear = right_vertical / right_horizontal if right_horizontal > 0 else 0

            avg_ear = (left_ear + right_ear) / 2
            # Eyes open if EAR > threshold
            ear_threshold = 0.15  # Typical threshold for open eyes
            return avg_ear > ear_threshold, float(avg_ear)

        except Exception as e:
            logger.debug(f"[Attention] Error detecting eyes: {e}")
            return True, 0.2  # Default to open

    def _classify_attention(
        self,
        gaze_x: float,
        gaze_y: float,
        head_rotation: Dict[str, float],
        eyes_open: bool
    ) -> str:
        """
        Classify attention level based on gaze, head pose, and eye state.

        Args:
            gaze_x: Normalized gaze X (-1 to 1)
            gaze_y: Normalized gaze Y (-1 to 1)
            head_rotation: Head rotation angles
            eyes_open: Whether eyes are open

        Returns:
            Attention status: 'looking', 'not_looking', or 'uncertain'
        """
        if not eyes_open:
            return 'not_looking'

        # Check if looking forward at screen
        # Gaze should be roughly centered (±0.3)
        # Head should not be turned too far (±30 degrees yaw)
        gaze_centered = abs(gaze_x) < 0.3 and abs(gaze_y) < 0.2
        head_forward = abs(head_rotation['y']) < 30  # yaw < 30 degrees

        if gaze_centered and head_forward:
            return 'looking'
        elif gaze_centered:
            return 'uncertain'
        else:
            return 'not_looking'

    def release(self):
        """Release resources."""
        if self.face_mesh:
            self.face_mesh.close()

