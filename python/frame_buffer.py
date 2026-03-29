from __future__ import annotations
import base64
import logging
import time
from typing import Optional, Tuple, Any

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


class FrameBuffer:
    """Manage frame buffering and compression for streaming."""

    def __init__(
        self,
        target_fps: int = 15,
        jpeg_quality: int = 80,
        max_width: int = 640,
    ):
        """
        Initialize frame buffer.

        Args:
            target_fps: Target frames per second for streaming
            jpeg_quality: JPEG compression quality (1-100)
            max_width: Maximum frame width (scales down if larger)
        """
        self.target_fps = target_fps
        self.frame_interval = 1.0 / target_fps  # Time between frames
        self.jpeg_quality = jpeg_quality
        self.max_width = max_width

        self.last_frame_time = 0
        self.frame_count = 0
        self.current_frame: Optional[Any] = None
        self.frame_lock = True

        logger.info(
            f"[FrameBuffer] Initialized: {target_fps} fps, "
            f"quality {jpeg_quality}, max width {max_width}"
        )

    def add_frame(self, frame: Any) -> bool:
        """
        Add a frame to the buffer.

        Frames are dropped if we haven't waited long enough since last frame
        (to maintain target FPS).

        Args:
            frame: Frame to buffer (numpy array)

        Returns:
            True if frame was added, False if dropped due to FPS throttling
        """
        current_time = time.time()

        # Check if enough time has passed for next frame
        if current_time - self.last_frame_time < self.frame_interval:
            return False  # Drop frame to maintain FPS

        self.current_frame = frame.copy()
        self.last_frame_time = current_time
        self.frame_count += 1
        return True

    def get_compressed_frame(self) -> Optional[Tuple[str, int, int]]:
        """
        Get current frame as base64 encoded JPEG.

        Args:
            None

        Returns:
            Tuple of (base64_data, width, height) or None if no frame
        """
        if self.current_frame is None:
            return None

        _cv2 = _get_cv2()
        try:
            frame = self.current_frame.copy()

            # Resize if needed
            h, w = frame.shape[:2]
            if w > self.max_width:
                scale = self.max_width / w
                new_h = int(h * scale)
                frame = _cv2.resize(frame, (self.max_width, new_h))
                w, h = frame.shape[1], frame.shape[0]

            # Convert RGB to BGR for OpenCV JPEG encoding
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                frame = _cv2.cvtColor(frame, _cv2.COLOR_RGB2BGR)

            # Encode as JPEG
            success, buffer = _cv2.imencode(
                '.jpg',
                frame,
                [_cv2.IMWRITE_JPEG_QUALITY, self.jpeg_quality]
            )

            if not success:
                logger.warning("[FrameBuffer] Failed to encode frame")
                return None

            # Encode to base64
            base64_data = base64.b64encode(buffer).decode('utf-8')
            return (base64_data, w, h)

        except Exception as e:
            logger.error(f"[FrameBuffer] Error compressing frame: {e}")
            return None

    def get_frame_with_detection_boxes(
        self,
        detection_results: list
    ) -> Optional[Tuple[str, int, int]]:
        """
        Get frame with detection boxes drawn for visualization.

        Args:
            detection_results: List of detected faces with positions

        Returns:
            Tuple of (base64_data, width, height) or None if no frame
        """
        if self.current_frame is None:
            return None

        _cv2 = _get_cv2()
        try:
            frame = self.current_frame.copy()

            # Draw detection boxes
            for face in detection_results:
                pos = face.get('position', {})
                x = int(pos.get('x', 0))
                y = int(pos.get('y', 0))
                w = int(pos.get('width', 0))
                h = int(pos.get('height', 0))
                is_registered = face.get('isRegisteredUser', False)

                # Color: green for registered, red for unknown
                color = (0, 255, 0) if is_registered else (0, 0, 255)

                # Draw rectangle
                _cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

                # Draw label
                label = (
                    f"Registered ({face.get('confidence', 0):.2f})"
                    if is_registered
                    else f"Unknown ({face.get('confidence', 0):.2f})"
                )
                _cv2.putText(
                    frame,
                    label,
                    (x, y - 10),
                    _cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    color,
                    2
                )

            # Resize if needed
            h_frame, w_frame = frame.shape[:2]
            if w_frame > self.max_width:
                scale = self.max_width / w_frame
                new_h = int(h_frame * scale)
                frame = _cv2.resize(frame, (self.max_width, new_h))
                w_frame, h_frame = frame.shape[1], frame.shape[0]

            # Convert RGB to BGR for OpenCV JPEG encoding
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                frame = _cv2.cvtColor(frame, _cv2.COLOR_RGB2BGR)

            # Encode as JPEG
            success, buffer = _cv2.imencode(
                '.jpg',
                frame,
                [_cv2.IMWRITE_JPEG_QUALITY, self.jpeg_quality]
            )

            if not success:
                logger.warning("[FrameBuffer] Failed to encode frame with boxes")
                return None

            # Encode to base64
            base64_data = base64.b64encode(buffer).decode('utf-8')
            return (base64_data, w_frame, h_frame)

        except Exception as e:
            logger.error(f"[FrameBuffer] Error adding detection boxes: {e}")
            return self.get_compressed_frame()

    def set_quality(self, quality: int) -> None:
        """Adjust JPEG quality."""
        quality = max(1, min(100, quality))
        self.jpeg_quality = quality
        logger.info(f"[FrameBuffer] Quality set to {quality}")

    def set_target_fps(self, fps: int) -> None:
        """Adjust target FPS."""
        fps = max(1, min(30, fps))
        self.target_fps = fps
        self.frame_interval = 1.0 / fps
        logger.info(f"[FrameBuffer] Target FPS set to {fps}")

    def get_stats(self) -> dict:
        """Get buffer statistics."""
        return {
            'targetFps': self.target_fps,
            'framesCaptured': self.frame_count,
            'jpegQuality': self.jpeg_quality,
            'maxWidth': self.max_width,
        }

    def reset(self) -> None:
        """Reset buffer."""
        self.current_frame = None
        self.frame_count = 0
        self.last_frame_time = 0
        logger.info("[FrameBuffer] Buffer reset")

