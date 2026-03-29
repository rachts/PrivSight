import asyncio
import logging
from typing import Optional, List, Any
from threading import Thread, Lock

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


class WebcamHandler:
    """Handle webcam capture and frame processing."""

    def __init__(self, camera_index: int = 0, frame_skip: int = 3, target_size: tuple = (320, 240)):
        """
        Initialize webcam handler.

        Args:
            camera_index: Camera device index (0 for default)
            frame_skip: Process every Nth frame for performance
            target_size: Resize frames to this size for faster processing
        """
        self.camera_index = camera_index
        self.frame_skip = frame_skip
        self.target_size = target_size

        self.cap = None
        self.current_frame: Optional[Any] = None
        self.frame_lock = Lock()
        self.running = False
        self.frame_count = 0

        self._init_camera()

    def _init_camera(self) -> None:
        """Initialize camera capture."""
        try:
            _cv2 = _get_cv2()
            self.cap = _cv2.VideoCapture(self.camera_index)
            if not self.cap.isOpened():
                logger.error("[Webcam] Failed to open camera")
                return

            # Set camera properties
            self.cap.set(_cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(_cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(_cv2.CAP_PROP_FPS, 30)
            self.cap.set(_cv2.CAP_PROP_BUFFERSIZE, 1)

            logger.info("[Webcam] Camera initialized successfully")
            self._start_capture_thread()

        except Exception as e:
            logger.error(f"[Webcam] Error initializing camera: {e}")

    def _start_capture_thread(self) -> None:
        """Start background thread for continuous frame capture."""
        self.running = True
        capture_thread = Thread(target=self._capture_loop, daemon=True)
        capture_thread.start()
        logger.info("[Webcam] Capture thread started")

    def _capture_loop(self) -> None:
        """Continuous frame capture loop running in background thread."""
        while self.running and self.cap:
            try:
                ret, frame = self.cap.read()
                if ret:
                    self.frame_count += 1
                    with self.frame_lock:
                        self.current_frame = frame
                else:
                    logger.warning("[Webcam] Failed to read frame")
            except Exception as e:
                logger.error(f"[Webcam] Error in capture loop: {e}")

    def get_frame(self) -> Optional[Any]:
        """
        Get current frame, resized for processing.

        Returns:
            Resized frame or None if unavailable
        """
        with self.frame_lock:
            if self.current_frame is None:
                return None

            # Skip frames for performance
            if self.frame_count % self.frame_skip != 0:
                return None

            _cv2 = _get_cv2()
            # Resize for faster processing
            resized = _cv2.resize(self.current_frame, self.target_size)
            return _cv2.cvtColor(resized, _cv2.COLOR_BGR2RGB)

    def get_frame_raw(self) -> Optional[Any]:
        """Get current frame without resizing."""
        with self.frame_lock:
            if self.current_frame is None:
                return None
            _cv2 = _get_cv2()
            return _cv2.cvtColor(self.current_frame, _cv2.COLOR_BGR2RGB)

    async def capture_frames(self, num_frames: int = 5) -> List[Any]:
        """
        Capture N frames for face registration.

        Args:
            num_frames: Number of frames to capture

        Returns:
            List of captured frames in RGB format
        """
        logger.info(f"[Webcam] Capturing {num_frames} frames for registration")
        captured = []
        frame_interval = 0.2  # 200ms between captures

        for i in range(num_frames):
            frame = self.get_frame_raw()
            if frame is not None:
                captured.append(frame)
                logger.debug(f"[Webcam] Captured frame {i+1}/{num_frames}")
            else:
                logger.warning(f"[Webcam] Failed to capture frame {i+1}")

            await asyncio.sleep(frame_interval)

        if len(captured) < num_frames:
            logger.warning(f"[Webcam] Only captured {len(captured)}/{num_frames} frames")

        return captured

    def release(self) -> None:
        """Release camera resources."""
        self.running = False
        if self.cap:
            self.cap.release()
            logger.info("[Webcam] Camera released")


class MockWebcamHandler(WebcamHandler):
    """Mock webcam for testing without physical camera."""

    def __init__(self, *args, **kwargs):
        """Initialize mock webcam with test frame."""
        _np = _get_np()
        self.target_size = kwargs.get('target_size', (320, 240))
        self.current_frame = _np.random.randint(0, 256, (*self.target_size, 3), dtype=_np.uint8)
        self.frame_lock = Lock()
        self.running = True
        self.frame_count = 0
        logger.info("[Webcam] Mock webcam initialized")

    def _init_camera(self) -> None:
        """Skip camera initialization for mock."""
        pass

    def _start_capture_thread(self) -> None:
        """Skip thread start for mock."""
        pass

    def release(self) -> None:
        """Release mock resources."""
        self.running = False
        logger.info("[Webcam] Mock webcam released")


class RemoteFrameHandler:
    """Handle frames received over WebSocket for cloud deployment."""

    def __init__(self, target_size: tuple = (320, 240)):
        """
        Initialize remote frame handler.

        Args:
            target_size: Resize frames to this size for faster processing
        """
        self.target_size = target_size
        self.current_frame: Optional[Any] = None
        self.frame_lock = Lock()
        self.frame_count = 0
        self.running = True
        logger.info("[Webcam] Remote frame handler initialized")

    def set_frame(self, frame: Any) -> None:
        """
        Set the current frame (received from WebSocket).
        
        Args:
            frame: Numpy array in RGB format
        """
        with self.frame_lock:
            self.current_frame = frame
            self.frame_count += 1

    def get_frame(self) -> Optional[Any]:
        """
        Get current frame, resized for processing.

        Returns:
            Resized frame or None if unavailable
        """
        with self.frame_lock:
            if self.current_frame is None:
                return None

            _cv2 = _get_cv2()
            # Resize for faster processing
            resized = _cv2.resize(self.current_frame, self.target_size)
            return resized # Already RGB from client

    def get_frame_raw(self) -> Optional[Any]:
        """Get current frame without resizing."""
        with self.frame_lock:
            return self.current_frame

    async def capture_frames(self, num_frames: int = 5) -> List[Any]:
        """
        Capture N frames (waits for new frames to arrive).

        Args:
            num_frames: Number of frames to capture

        Returns:
            List of captured frames in RGB format
        """
        captured = []
        last_count = self.frame_count
        
        timeout = 10 # 10 seconds timeout
        start_time = asyncio.get_event_loop().time()

        while len(captured) < num_frames and self.running:
            if self.frame_count > last_count:
                frame = self.get_frame_raw()
                if frame is not None:
                    captured.append(frame)
                    last_count = self.frame_count
            
            if asyncio.get_event_loop().time() - start_time > timeout:
                logger.warning("[Webcam] Timeout waiting for remote frames")
                break
                
            await asyncio.sleep(0.1)
            
        return captured

    def release(self) -> None:
        """Release resources."""
        self.running = False
        logger.info("[Webcam] Remote frame handler released")
