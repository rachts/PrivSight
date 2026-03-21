# Developer Quick Reference - PRIVSIGHT v2.0

**Created by Rachit**

## File Index - Know Where Everything Is

### Critical Files
| Path | Purpose | Priority |
|------|---------|----------|
| `shared/types.ts` | Type definitions for Electron ↔ Python communication | HIGH |
| `electron/src/renderer/page.tsx` | Main UI layout with all features | HIGH |
| `python/server.py` | WebSocket server & message routing | HIGH |
| `electron/index.html` | HTML entry point | MEDIUM |
| `App.tsx` | Root React component | HIGH |

### Python Backend Modules
| File | Class/Function | What It Does |
|------|---|---|
| `server.py` | `ServiceState` | Global service state management |
| `server.py` | `handle_message()` | Route IPC messages to handlers |
| `multi_face_processor.py` | `MultiFaceProcessor` | Detect multiple faces, track positions |
| `attention_detector.py` | `AttentionDetector` | Gaze tracking with MediaPipe |
| `notification_classifier.py` | `NotificationClassifier` | App sensitivity rules engine |
| `performance_monitor.py` | `PerformanceMonitor` | Track CPU, memory, FPS metrics |
| `frame_buffer.py` | `FrameBuffer` | Buffer & compress video frames |

### React Components
| File | Component | State | Props |
|------|-----------|-------|-------|
| `page.tsx` | `Page` | activeTab, presenceData | None |
| `MainWindow.tsx` | `MainWindow` | presenceData, config | onPresenceUpdate |
| `VideoPreview.tsx` | `VideoPreview` | canvas ref | frameData, detectedFaces |
| `AttentionIndicator.tsx` | `AttentionIndicator` | animation state | status, gazeX, gazeY |
| `MultiUserAlert.tsx` | `MultiUserAlert` | alert visibility | detectedFaces |
| `NotificationFilter.tsx` | `NotificationFilter` | classifications | presenceData |
| `PerformanceMonitor.tsx` | `PerformanceMonitor` | chart data | metrics |

## Common Development Tasks

### Adding a New IPC Handler

1. **Define message type in `shared/types.ts`**:
```typescript
export interface MyMessage {
  type: 'my_message';
  payload: { data: string };
}
```

2. **Add handler in `python/server.py`**:
```python
elif msg_type == 'my_message':
    data = payload.get('data', '')
    # Process...
    await websocket.send(json.dumps({
        'type': 'my_response',
        'payload': { result: 'success' }
    }))
```

3. **Call from Electron**:
```typescript
window.electronAPI?.ipcSend('my_message', { data: 'hello' });
```

### Adding a New Python Module

1. Create `python/module_name.py`
2. Add class with `__init__` and main methods
3. Import in `server.py`: `from module_name import ClassName`
4. Initialize in `handle_init()`: `state.module = ClassName()`
5. Use in monitoring loop or message handlers

### Adding a New React Component

1. Create `electron/src/renderer/components/MyComponent.tsx`
2. Create companion styles in `styles/MyComponent.css`
3. Import in parent component: `import MyComponent from './components/MyComponent'`
4. Use with props: `<MyComponent prop1="value" />`

## Data Flow Examples

### Example 1: Detecting Multiple Faces
```
Python Server:
  frame → multi_face_processor.detect_faces() 
  → [FaceInfo, FaceInfo, ...]
  → analyze_presence() → {"status": "multiple_faces", ...}
  
Electron:
  receives PresenceUpdate
  → page.tsx detects "showMultiUserAlert = true"
  → renders MultiUserAlert component
  → CSS animation shows warning
  → NotificationOverlay activates
```

### Example 2: User Changes App Sensitivity
```
Electron:
  NotificationFilter.tsx: user clicks dropdown
  → calls window.electronAPI.send('set_app_sensitivity', {
      appName: 'Gmail',
      sensitivity: 'sensitive'
    })
  
Python:
  receives message → handle_message() routes to handler
  → NotificationClassifier.set_app_sensitivity('Gmail', 'sensitive')
  → saves to persistent storage
  
Next Notification:
  NotificationMonitor checks Gmail → classifier returns 'sensitive'
  → overlay activates
```

## Debugging Tips

### Python Backend
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Log important events
logger.info(f"[Module] Event: {variable}")
logger.error(f"[Module] Error: {error}")
```

### Electron/React
```typescript
console.log("[v0] Component mounted", props);
console.log("[v0] State updated:", newState);
console.log("[v0] IPC message received:", message);
```

### Check WebSocket Connection
```python
# In server.py monitoring_loop:
print(f"[Monitor] Connected clients: {len(state.clients)}")
```

## Testing Individual Modules

### Test Python Module in Isolation
```bash
cd python
python -c "
from multi_face_processor import MultiFaceProcessor
from face_embeddings import FaceEmbeddingsManager
import cv2

manager = FaceEmbeddingsManager('data/face_embeddings.json')
processor = MultiFaceProcessor(manager)
print('Modules loaded successfully')
"
```

### Test React Component
```bash
cd electron
npm run dev:renderer
# Open browser devtools (F12)
# Check Console tab for React errors
# Use React DevTools extension to inspect component tree
```

### Test IPC Communication
Add to Electron main process:
```typescript
ipcMain.on('test-message', (event, arg) => {
  console.log('[IPC] Received test:', arg);
  event.reply('test-response', { success: true });
});
```

## Performance Optimization Checklist

- [ ] Frame skipping enabled in PerformanceMonitor
- [ ] JPEG compression quality set to 80 (frame_buffer.py)
- [ ] Face detection sensitivity tuned to match target FPS
- [ ] Notification overlay uses CSS blur (no canvas computation)
- [ ] WebSocket message batching for multiple faces
- [ ] React components use memo() to prevent unnecessary renders
- [ ] Python server runs frame processing in separate thread

## Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "Python service not responding" | Server not started | Run `python server.py` |
| "WebSocket connection refused" | Port 8765 in use | Kill process or change port |
| "Face embedding file not found" | Not registered | Run `python register_face.py` |
| "MediaPipe not found" | Dependency missing | `pip install mediapipe` |
| "Canvas rendering is slow" | Too many face boxes | Reduce detection refresh rate |
| "UI not updating" | Missing onPresenceUpdate | Check page.tsx event handlers |

## Code Style Guidelines

### Python
- Use snake_case for functions/variables
- Type hints for all functions
- Docstrings for classes and public methods
- Log important events with [Module] prefix

### TypeScript/React
- Use camelCase for functions/variables
- Define interfaces for all props
- Use React.FC for component types
- Name states with `handle` prefix for callbacks

## Performance Monitoring

### Check CPU Usage
```python
# In performance_monitor.py
import psutil
cpu = psutil.cpu_percent(interval=0.1)
print(f"CPU: {cpu}%")
```

### Check Memory Usage
```python
import psutil
process = psutil.Process()
mem = process.memory_info().rss / 1024 / 1024  # MB
print(f"Memory: {mem:.1f} MB")
```

### Monitor Frame Rate
```python
# In server.py monitoring_loop
perf = state.performance_monitor.get_metrics()
print(f"FPS: {perf['fps']}, Latency: {perf['processingTime']}ms")
```

## Useful Commands

```bash
# Start everything at once (run in separate terminals)
cd python && python -m server                    # Terminal 1
cd electron && npm run dev:renderer             # Terminal 2
cd electron && npm run dev:main                 # Terminal 3

# Register a new face
cd python && python register_face.py "Name"

# Build for production
cd electron && npm run build:main && npm run build:renderer

# Check for TypeScript errors
cd electron && npx tsc --noEmit

# Run Python type checker
cd python && mypy *.py --ignore-missing-imports

# Format Python code
cd python && black *.py

# Format TypeScript code
cd electron && npx prettier --write src/
```

## Architecture Decisions

### Why WebSocket for IPC?
- Works across process boundaries reliably
- Supports bidirectional real-time messages
- Easy to add logging and debugging
- Can extend to network IPC if needed

### Why MediaPipe for Gaze?
- Lightweight (~50MB) vs full eye tracking libraries
- Works on CPU, no GPU required
- Good accuracy for consumer devices
- Well-maintained by Google

### Why Frame Buffering?
- Smooths out inconsistent frame rates
- Enables client-side quality negotiation
- Reduces bandwidth for low-power machines
- Allows pausing/resuming without loss

### Why Adaptive Frame Skipping?
- Maintains smooth UI while reducing CPU load
- Automatically adapts to system capabilities
- Skips frames intelligently (worst quality first)
- Transparent to application logic

## Future Enhancement Ideas

1. **Multi-user Support**
   - Track multiple registered users
   - Show "Alice is looking" vs "unknown person"
   - Different privacy rules per user

2. **Cloud Sync**
   - Sync app classifications to cloud
   - Settings backup and restore
   - Usage analytics

3. **AI-Powered Classification**
   - Auto-learn app sensitivity from user behavior
   - Suggest privacy level for new apps
   - Confidence scoring

4. **Eye Tracking Integration**
   - Support hardware eye trackers
   - Better gaze accuracy for accessibility
   - Eye fatigue detection

5. **Custom Notifications**
   - Allow-list mode (show only critical)
   - Time-based rules (silent during focus)
   - App-specific scheduling

---

**Last Updated**: January 2024
**Version**: 2.0
**Maintainer**: You
