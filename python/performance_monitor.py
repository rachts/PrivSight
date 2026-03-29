"""
Performance monitoring and optimization.
Tracks CPU usage, memory, and frame processing metrics.
"""

from __future__ import annotations
import logging
import psutil
import time
from typing import Dict, Any
from collections import deque
from threading import Lock

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Monitor and optimize performance metrics."""

    def __init__(self, max_history: int = 100):
        """
        Initialize performance monitor.

        Args:
            max_history: Number of frames to keep in history for averaging
        """
        self.max_history = max_history
        self.frame_times = deque(maxlen=max_history)
        self.cpu_usage_history = deque(maxlen=max_history)
        self.memory_usage_history = deque(maxlen=max_history)
        self.frame_skip_counts = deque(maxlen=max_history)

        self.start_time = time.time()
        self.frames_processed = 0
        self.frames_skipped = 0
        self.lock = Lock()

        # Process for CPU tracking
        self.process = psutil.Process()

        # Motion tracking
        self.previous_gray_frame = None
        self.motion_threshold = 15 # Minimum pixel difference to register "motion"
        self.motion_pixel_ratio_threshold = 0.05 # 5% of pixels must have changed

        logger.info("[Performance] Monitor initialized")

    def record_frame(
        self,
        processing_time_ms: float,
        skipped: bool = False
    ) -> None:
        """
        Record frame processing metrics.

        Args:
            processing_time_ms: Time to process frame in milliseconds
            skipped: Whether this frame was skipped
        """
        with self.lock:
            self.frame_times.append(processing_time_ms)
            if skipped:
                self.frames_skipped += 1
            else:
                self.frames_processed += 1

    def update_system_metrics(self) -> None:
        """Update CPU and memory usage metrics."""
        try:
            with self.lock:
                # Get CPU percentage (non-blocking)
                cpu = self.process.cpu_percent(interval=None)
                self.cpu_usage_history.append(cpu)

                # Get memory in MB
                memory = self.process.memory_info().rss / (1024 * 1024)
                self.memory_usage_history.append(memory)
        except Exception as e:
            logger.warning(f"[Performance] Error getting system metrics: {e}")

    def get_metrics(self) -> Dict[str, Any]:
        """
        Get current performance metrics.

        Returns:
            Dictionary with performance data
        """
        with self.lock:
            total_frames = self.frames_processed + self.frames_skipped
            uptime = time.time() - self.start_time

            # Calculate averages
            avg_frame_time = (
                sum(self.frame_times) / len(self.frame_times)
                if self.frame_times else 0
            )
            avg_cpu = (
                sum(self.cpu_usage_history) / len(self.cpu_usage_history)
                if self.cpu_usage_history else 0
            )
            avg_memory = (
                sum(self.memory_usage_history) / len(self.memory_usage_history)
                if self.memory_usage_history else 0
            )
            frame_skip_rate = (
                self.frames_skipped / total_frames if total_frames > 0 else 0
            )

            # Calculate actual FPS
            actual_fps = (
                self.frames_processed / uptime if uptime > 0 else 0
            )

            return {
                'cpuUsage': float(avg_cpu),
                'memoryUsage': float(avg_memory),
                'processingTime': float(avg_frame_time),
                'frameSkipRate': float(frame_skip_rate),
                'fps': float(actual_fps),
                'uptime': float(uptime),
                'framesProcessed': int(self.frames_processed),
                'framesSkipped': int(self.frames_skipped),
            }

        # Wait... this is original code. We are modifying `should_skip_frame` to incorporate motion-based skipping.
        pass

    def check_motion(self, frame: 'np.ndarray') -> bool:
        """
        Check if there's enough motion to warrant processing.
        Returns True if motion > threshold (should process), False if static (should skip).
        """
        try:
            import cv2
            import numpy as np
            
            # Convert to small grayscale for cheap diffing
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            gray = cv2.resize(gray, (160, 120)) # Small size to make diff super fast
            
            if self.previous_gray_frame is None:
                self.previous_gray_frame = gray
                return True
                
            # Compute absolute difference
            diff = cv2.absdiff(self.previous_gray_frame, gray)
            _, thresh = cv2.threshold(diff, self.motion_threshold, 255, cv2.THRESH_BINARY)
            
            motion_pixels = cv2.countNonZero(thresh)
            total_pixels = gray.shape[0] * gray.shape[1]
            
            motion_ratio = motion_pixels / total_pixels
            
            self.previous_gray_frame = gray
            
            return motion_ratio > self.motion_pixel_ratio_threshold
            
        except Exception as e:
            logger.debug(f"[Performance] Error checking motion: {e}")
            return True # Always process on error

    def should_skip_frame(
        self,
        frame: 'np.ndarray',
        frame_quality: float,
        target_cpu_percent: float = 10.0
    ) -> bool:
        """
        Determine if frame should be skipped for performance optimization.

        Skips frames if:
        - No motion detected (static scene)
        - Frame quality is poor (blurry/dark)
        - CPU usage is above target
        """
        # 1. Motion Check: If scene is static, definitely skip expensive pipelines
        has_motion = self.check_motion(frame)
        if not has_motion:
            return True

        # Always process frames with good quality (if there is motion)
        if frame_quality > 0.7:
            return False

        # Check current CPU usage
        try:
            current_cpu = self.process.cpu_percent(interval=None)
            if current_cpu > target_cpu_percent:
                return True
        except Exception:
            pass

        # Skip low quality frames if CPU is elevated
        return frame_quality < 0.4

    def estimate_frame_quality(
        self,
        frame: 'np.ndarray'
    ) -> float:
        """
        Estimate frame quality for smart frame skipping.

        Low quality frames (very dark/bright, blurry) can be skipped.

        Args:
            frame: Image frame to analyze

        Returns:
            Quality score 0-1 (1 = best quality)
        """
        try:
            import cv2
            import numpy as np

            # Convert to grayscale if needed
            if len(frame.shape) == 3:
                gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            else:
                gray = frame

            # Calculate brightness
            brightness = np.mean(gray)
            brightness_score = 1.0 if 50 < brightness < 200 else 0.3

            # Calculate contrast (using Laplacian variance)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            contrast = laplacian.var()
            # Normalize to 0-1 (lower contrast is lower quality)
            contrast_score = min(1.0, contrast / 500.0)

            # Combined quality score
            quality = (brightness_score * 0.3) + (contrast_score * 0.7)
            return float(quality)

        except Exception as e:
            logger.debug(f"[Performance] Error estimating frame quality: {e}")
            return 0.8  # Default to good quality if error

    def get_status_message(self) -> str:
        """Get human-readable performance status."""
        metrics = self.get_metrics()
        cpu = metrics['cpuUsage']
        memory = metrics['memoryUsage']
        fps = metrics['fps']

        if cpu < 5:
            cpu_status = 'excellent'
        elif cpu < 10:
            cpu_status = 'good'
        elif cpu < 20:
            cpu_status = 'moderate'
        else:
            cpu_status = 'high'

        return (
            f"CPU: {cpu:.1f}% ({cpu_status}), "
            f"Memory: {memory:.0f}MB, "
            f"FPS: {fps:.1f}"
        )

    def reset_metrics(self) -> None:
        """Reset all metrics."""
        with self.lock:
            self.frame_times.clear()
            self.cpu_usage_history.clear()
            self.memory_usage_history.clear()
            self.frame_skip_counts.clear()
            self.frames_processed = 0
            self.frames_skipped = 0
            self.start_time = time.time()
            logger.info("[Performance] Metrics reset")

