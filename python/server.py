"""
Main WebSocket server for face recognition service.
Communicates with Electron app via WebSocket protocol.
"""

import asyncio
import json
import logging
import os
import signal
from datetime import datetime
from pathlib import Path

import websockets
from websockets.server import WebSocketServerProtocol

from face_embeddings import FaceEmbeddingsManager
from multi_face_processor import MultiFaceProcessor
from attention_detector import AttentionDetector
from notification_classifier import NotificationClassifier
from performance_monitor import PerformanceMonitor
from frame_buffer import FrameBuffer
from notification_monitor import NotificationMonitor
import base64
import cv2
import numpy as np
from webcam_handler import WebcamHandler, RemoteFrameHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(name)s] %(levelname)s: %(message)s',
)
logger = logging.getLogger(__name__)

# Global state
class ServiceState:
    def __init__(self):
        self.running = True
        self.clients: set[WebSocketServerProtocol] = set()
        self.config = {
            'sensitivity': 80,
            'updateFrequency': 200,
            'blurIntensity': 15,
            'enableAttentionDetection': True,
            'enableShoulderSurfingAlert': True,
            'enableLivePreview': True,
            'previewFrameRate': 15,
            'performanceTarget': 10,
        }
        self.webcam = None
        self.embeddings_manager = None
        self.monitor = None
        self.multi_face_processor = None
        self.attention_detector = None
        self.notification_classifier = None
        self.performance_monitor = None
        self.frame_buffer = None


state = ServiceState()


async def handle_client(websocket: WebSocketServerProtocol, path: str):
    """Handle incoming WebSocket connections from Electron app."""
    logger.info(f"[Client] Connected from {websocket.remote_address}")
    state.clients.add(websocket)

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                await handle_message(websocket, data)
            except json.JSONDecodeError:
                logger.error(f"[Client] Invalid JSON received: {message}")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'payload': {'message': 'Invalid JSON format'}
                }))
            except Exception as e:
                logger.error(f"[Client] Error handling message: {e}")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'payload': {'message': str(e)}
                }))
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"[Client] Disconnected: {websocket.remote_address}")
    finally:
        state.clients.discard(websocket)


async def handle_message(websocket: WebSocketServerProtocol, data: dict):
    """Route incoming messages to appropriate handlers."""
    msg_type = data.get('type')
    payload = data.get('payload', {})

    if msg_type == 'init':
        logger.info("[Handler] Initialization request")
        await handle_init(websocket, payload)

    elif msg_type == 'config_update':
        logger.info(f"[Handler] Config update: {payload}")
        state.config.update(payload)

    elif msg_type == 'register_face':
        logger.info("[Handler] Face registration request")
        await handle_register_face(websocket, payload)

    elif msg_type == 'health_check':
        logger.debug("[Handler] Health check")
        await websocket.send(json.dumps({
            'type': 'health_check_response',
            'payload': {'timestamp': int(datetime.now().timestamp() * 1000)}
        }))

    elif msg_type == 'status_request':
        logger.info("[Handler] Status request")
        await send_status(websocket)

    elif msg_type == 'get_app_sensitivity':
        app_name = payload.get('appName', '')
        sensitivity = (
            state.notification_classifier.get_app_sensitivity(app_name)
            if state.notification_classifier else 'moderate'
        )
        await websocket.send(json.dumps({
            'type': 'app_sensitivity',
            'payload': {'appName': app_name, 'sensitivity': sensitivity}
        }))

    elif msg_type == 'set_app_sensitivity':
        app_name = payload.get('appName', '')
        sensitivity = payload.get('sensitivity', 'moderate')
        if state.notification_classifier:
            state.notification_classifier.set_app_sensitivity(app_name, sensitivity)
            logger.info(f"[Handler] Set {app_name} sensitivity to {sensitivity}")
        await websocket.send(json.dumps({
            'type': 'sensitivity_updated',
            'payload': {'appName': app_name, 'sensitivity': sensitivity}
        }))

    elif msg_type == 'get_classifications':
        summary = (
            state.notification_classifier.get_classification_summary()
            if state.notification_classifier else {}
        )
        await websocket.send(json.dumps({
            'type': 'classifications',
            'payload': summary
        }))

    elif msg_type == 'get_performance_metrics':
        metrics = (
            state.performance_monitor.get_metrics()
            if state.performance_monitor else {}
        )
        await websocket.send(json.dumps({
            'type': 'performance_data',
            'payload': metrics
        }))

    elif msg_type == 'enable_attention_detection':
        enable = payload.get('enable', True)
        state.config['enableAttentionDetection'] = enable
        if state.attention_detector:
            state.attention_detector.enabled = enable
        logger.info(f"[Handler] Attention detection {'enabled' if enable else 'disabled'}")

    elif msg_type == 'enable_live_preview':
        enable = payload.get('enable', True)
        state.config['enableLivePreview'] = enable
        logger.info(f"[Handler] Live preview {'enabled' if enable else 'disabled'}")

    elif msg_type == 'process_frame':
        # Received a frame from the web client
        if isinstance(state.webcam, RemoteFrameHandler):
            try:
                # payload['frame'] is a base64 string: "data:image/jpeg;base64,..."
                frame_data = payload.get('frame', '')
                if ',' in frame_data:
                    frame_data = frame_data.split(',')[1]
                
                img_bytes = base64.b64decode(frame_data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    # Convert BGR (OpenCV default) to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    state.webcam.set_frame(frame_rgb)
            except Exception as e:
                logger.error(f"[Handler] Error decoding remote frame: {e}")

    else:
        logger.warning(f"[Handler] Unknown message type: {msg_type}")


async def handle_init(websocket: WebSocketServerProtocol, config: dict):
    """Initialize service with client config."""
    state.config.update(config)

    # Initialize face embeddings manager
    embeddings_path = Path(__file__).parent / 'data' / 'face_embeddings.json'
    embeddings_path.parent.mkdir(parents=True, exist_ok=True)

    state.embeddings_manager = FaceEmbeddingsManager(str(embeddings_path))
    logger.info(f"[Init] Face embeddings manager initialized at {embeddings_path}")

    # Initialize webcam handler (Try local first, fallback to remote if it fails or if cloud mode)
    is_cloud = os.getenv('PRIVSIGHT_CLOUD', 'false').lower() == 'true' or config.get('useRemoteFrame', False)
    
    if not is_cloud:
        try:
            state.webcam = WebcamHandler(
                frame_skip=max(1, int(1000 / state.config.get('updateFrequency', 200))),
                target_size=(320, 240)
            )
            if state.webcam.cap is None or not state.webcam.cap.isOpened():
                 raise Exception("Local camera not found")
            logger.info("[Init] Local webcam handler initialized")
        except Exception as e:
            logger.warning(f"[Init] Local camera failed, switching to remote mode: {e}")
            is_cloud = True

    if is_cloud:
        state.webcam = RemoteFrameHandler(target_size=(320, 240))
        logger.info("[Init] Remote frame handler initialized (Web Mode)")

    # Initialize notification monitor (legacy)
    state.monitor = NotificationMonitor(
        embeddings_manager=state.embeddings_manager,
        sensitivity=state.config.get('sensitivity', 80) / 100.0,
    )
    logger.info("[Init] Notification monitor initialized")

    # Initialize v2.0 modules
    state.multi_face_processor = MultiFaceProcessor(
        embeddings_manager=state.embeddings_manager,
        sensitivity=state.config.get('sensitivity', 80) / 100.0,
    )
    logger.info("[Init] Multi-face processor initialized")

    state.attention_detector = AttentionDetector(
        enable=state.config.get('enableAttentionDetection', True)
    )
    logger.info("[Init] Attention detector initialized")

    state.notification_classifier = NotificationClassifier()
    logger.info("[Init] Notification classifier initialized")

    state.performance_monitor = PerformanceMonitor()
    logger.info("[Init] Performance monitor initialized")

    state.frame_buffer = FrameBuffer(
        target_fps=state.config.get('previewFrameRate', 15),
        jpeg_quality=80,
        max_width=640
    )
    logger.info("[Init] Frame buffer initialized")

    # Send ready message
    await websocket.send(json.dumps({
        'type': 'init_complete',
        'payload': {'timestamp': int(datetime.now().timestamp() * 1000)}
    }))

    # Start monitoring loop
    asyncio.create_task(monitoring_loop())


async def handle_register_face(websocket: WebSocketServerProtocol, payload: dict):
    """Handle face registration from webcam."""
    if not state.webcam:
        await websocket.send(json.dumps({
            'type': 'error',
            'payload': {'message': 'Webcam not initialized'}
        }))
        return

    logger.info("[Register] Starting face registration...")
    num_samples = payload.get('samples', 5)

    try:
        frames = await state.webcam.capture_frames(num_samples)
        if state.embeddings_manager:
            embedding_id = state.embeddings_manager.register_face(
                frames=frames,
                name=payload.get('name', 'User')
            )
            logger.info(f"[Register] Face registered with ID: {embedding_id}")
            await websocket.send(json.dumps({
                'type': 'registration_complete',
                'payload': {'id': embedding_id}
            }))
        else:
            await websocket.send(json.dumps({
                'type': 'error',
                'payload': {'message': 'Embeddings manager not initialized'}
            }))
    except Exception as e:
        logger.error(f"[Register] Registration error: {e}")
        await websocket.send(json.dumps({
            'type': 'error',
            'payload': {'message': str(e)}
        }))


async def monitoring_loop():
    """Main monitoring loop - process frames and send presence updates."""
    logger.info("[Monitor] Starting monitoring loop")

    frame_counter = 0

    while state.running and state.webcam:
        try:
            import time
            frame_start = time.time()
            frame_counter += 1

            # Get next frame
            frame = state.webcam.get_frame()
            if frame is None:
                await asyncio.sleep(0.01)
                continue
                
            # Process every N frames
            process_every_n = state.config.get('processEveryNFrames', 3)
            if frame_counter % process_every_n != 0:
                continue

            # Check frame quality for performance optimization
            frame_quality = (
                state.performance_monitor.estimate_frame_quality(frame)
                if state.performance_monitor else 0.8
            )
            # Check if we should skip this frame to save CPU / wait for motion
            if state.performance_monitor and state.performance_monitor.should_skip_frame(frame, frame_quality):
                state.performance_monitor.record_frame(0, skipped=True)
                continue
            # Detect multiple faces in a thread
            detected_faces = []
            if state.multi_face_processor:
                detected_faces = await asyncio.to_thread(state.multi_face_processor.detect_faces, frame)

            # Detect attention (gaze) for multiple faces in a thread
            attention_data = []
            if state.attention_detector and state.config.get('enableAttentionDetection', True):
                attention_data = await asyncio.to_thread(state.attention_detector.detect_attention, frame)

            # Analyze presence with multi-face logic and gaze/attention context
            presence_analysis = (
                state.multi_face_processor.analyze_presence(detected_faces, attention_data)
                if state.multi_face_processor else {}
            )
            presence_status = presence_analysis.get('status', 'error')

            # Extract main user's attention (fallback) or use first returned
            primary_attention = attention_data[0] if isinstance(attention_data, list) and len(attention_data) > 0 else {'status': 'uncertain', 'confidence': 0}

            # Add frame to buffer for streaming
            frame_added = (
                state.frame_buffer.add_frame(frame)
                if state.frame_buffer else False
            )

            # Get compressed frame if streaming is enabled
            frame_preview = None
            if (state.config.get('enableLivePreview', True) and
                frame_added and state.frame_buffer):
                frame_data = state.frame_buffer.get_frame_with_detection_boxes(detected_faces)
                if frame_data:
                    frame_preview, _, _ = frame_data

            # Record performance metrics
            frame_time = (time.time() - frame_start) * 1000
            if state.performance_monitor:
                state.performance_monitor.record_frame(frame_time, skipped=False)
                state.performance_monitor.update_system_metrics()
                perf_metrics = state.performance_monitor.get_metrics()
            else:
                perf_metrics = None

            # Build presence update message
            payload = {
                'status': presence_status,
                'timestamp': int(datetime.now().timestamp() * 1000),
                'confidence': detected_faces[0]['confidence'] if detected_faces else 0,
                'detectedFaces': presence_analysis.get('face_count', 0),
                'faces': detected_faces,
                'attention': primary_attention,
                'attentionAll': attention_data if isinstance(attention_data, list) else [],
            }

            if perf_metrics:
                payload['performanceMetrics'] = perf_metrics

            if frame_preview:
                payload['framePreview'] = frame_preview

            # Broadcast structured events to all connected clients
            for client in list(state.clients):
                try:
                    # Emit specific presence status as structured event
                    await client.send(json.dumps({
                        'type': presence_status, # e.g., 'privacy_mode_active', 'face_detected'
                        'payload': payload
                    }))
                    
                    if perf_metrics:
                        await client.send(json.dumps({
                            'type': 'fps_update',
                            'payload': {'fps': perf_metrics.get('fps', 0)}
                        }))
                        await client.send(json.dumps({
                            'type': 'cpu_usage_update',
                            'payload': {'cpu': perf_metrics.get('cpu_usage', 0)}
                        }))
                except websockets.exceptions.ConnectionClosed:
                    state.clients.discard(client)
                except Exception as e:
                    logger.debug(f"[Monitor] Error sending to client: {e}")

            # Control frame rate
            await asyncio.sleep(state.config.get('updateFrequency', 200) / 1000.0)

        except Exception as e:
            logger.error(f"[Monitor] Error in monitoring loop: {e}")
            await asyncio.sleep(0.1)


def determine_presence_status(detection_result: dict) -> str:
    """Determine presence status from detection result."""
    if detection_result.get('error'):
        return 'error'

    face_count = detection_result.get('face_count', 0)
    is_registered = detection_result.get('is_registered_user', False)

    if face_count == 0:
        return 'no_face'
    elif face_count > 1:
        return 'multiple_faces'
    elif is_registered:
        return 'user_detected'
    else:
        return 'unknown_detected'


async def send_status(websocket: WebSocketServerProtocol):
    """Send current service status."""
    perf_metrics = (
        state.performance_monitor.get_metrics()
        if state.performance_monitor else {}
    )
    classifications = (
        state.notification_classifier.get_classification_summary()
        if state.notification_classifier else {}
    )

    status = {
        'type': 'status',
        'payload': {
            'running': state.running,
            'timestamp': int(datetime.now().timestamp() * 1000),
            'config': state.config,
            'performanceMetrics': perf_metrics,
            'classifications': classifications,
            'modulesInitialized': {
                'multiFaceProcessor': state.multi_face_processor is not None,
                'attentionDetector': state.attention_detector is not None,
                'notificationClassifier': state.notification_classifier is not None,
                'performanceMonitor': state.performance_monitor is not None,
                'frameBuffer': state.frame_buffer is not None,
            }
        }
    }
    await websocket.send(json.dumps(status))


async def shutdown(signal_num):
    """Graceful shutdown."""
    logger.info(f"[Service] Shutdown signal received ({signal_num})")
    state.running = False

    # Close all clients
    for client in list(state.clients):
        await client.close()

    # Close webcam
    if state.webcam:
        state.webcam.release()

    # Release attention detector resources
    if state.attention_detector:
        state.attention_detector.release()

    # Reset performance monitor
    if state.performance_monitor:
        state.performance_monitor.reset_metrics()

    logger.info("[Service] Shutdown complete")


async def main():
    """Start the WebSocket server."""
    logger.info("[Service] Privacy App Backend starting...")

    # Handle signals
    for sig in [signal.SIGTERM, signal.SIGINT]:
        asyncio.get_event_loop().add_signal_handler(
            sig, lambda: asyncio.create_task(shutdown(sig))
        )

    # Start WebSocket server
    host = os.getenv('SERVER_HOST', 'localhost')
    port = int(os.getenv('SERVER_PORT', 8765))

    logger.info(f"[Service] Starting WebSocket server on ws://{host}:{port}")

    async with websockets.serve(handle_client, host, port):
        logger.info("[Service] WebSocket server running")
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            logger.info("[Service] Keyboard interrupt received")


if __name__ == '__main__':
    asyncio.run(main())
