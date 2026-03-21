# Privacy Protector v2.0 - Architecture & System Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      ELECTRON DESKTOP APP                        │
│                     (React + TypeScript)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Page Component (Main Layout)               │   │
│  │  Manages 5 tabs: Dashboard, Camera, Attention, Notify   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                      │
│        ┌──────────────────┼──────────────────┐                  │
│        │                  │                  │                  │
│        ▼                  ▼                  ▼                  │
│  ┌───────────┐  ┌───────────────┐  ┌─────────────────┐        │
│  │ MainWindow│  │VideoPreview   │  │AttentionIndica. │        │
│  │Dashboard  │  │Live Camera    │  │Gaze Tracking    │        │
│  └───────────┘  └───────────────┘  └─────────────────┘        │
│        │              │                  │                      │
│        └──────────────┬──────────────────┘                      │
│                       │                                          │
│                  ┌────▼─────┐                                   │
│                  │ Real-Time │ Real-time data                   │
│                  │  Updates  │ (60 fps)                         │
│                  └────┬─────┘                                   │
│                       │                                          │
│        ┌──────────────┼──────────────────┐                      │
│        │              │                  │                      │
│        ▼              ▼                  ▼                      │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │MultiUser │ │Notification  │ │ Performance  │               │
│  │Alert     │ │Filter        │ │ Monitor      │               │
│  └──────────┘ └──────────────┘ └──────────────┘               │
│        │              │                  │                      │
│        └──────────────┼──────────────────┘                      │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                   WebSocket
                   Port 8765
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND SERVICE                        │
│                   (WebSocket Server)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  server.py - Main WebSocket Host & Message Router        │  │
│  │  • Handles IPC messages from Electron                    │  │
│  │  • Broadcasts presence updates                           │  │
│  │  • Manages service state                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│      ┌────────────────────┼─────────────────────┐               │
│      │                    │                     │               │
│      ▼                    ▼                     ▼               │
│  ┌──────────┐      ┌─────────────┐       ┌──────────────┐     │
│  │WebcamH.  │      │FaceEmbeddingM│      │Notification  │     │
│  │          │      │              │      │Monitor       │     │
│  │Captures  │      │Recognition   │      │              │     │
│  │frames    │      │& matching    │      │Legacy system │     │
│  │30 fps    │      │              │      │              │     │
│  └──────────┘      └─────────────┘       └──────────────┘     │
│       │                   │                     │               │
│       │                   │                     │               │
│       └───────────┬───────┴──────────┬──────────┘               │
│                   │                  │                          │
│                   ▼                  ▼                          │
│         ┌──────────────────────────────────┐                   │
│         │   v2.0 INTELLIGENCE MODULES      │                   │
│         └──────────────────────────────────┘                   │
│                   │                                             │
│   ┌───────────────┼───────────────┬───────────────┐             │
│   │               │               │               │             │
│   ▼               ▼               ▼               ▼             │
│ ┌──────┐    ┌───────────┐   ┌──────────┐   ┌─────────┐        │
│ │Multi-│    │Attention  │   │Notification│ │Performance│       │
│ │Face  │    │Detector   │   │Classifier  │ │Monitor  │        │
│ │Proc. │    │(MediaPipe)│   │            │ │          │        │
│ │      │    │ Gaze      │   │App Rules   │ │CPU/Mem  │        │
│ │Detects│   │Head Pose  │   │Filtering   │ │FPS/Lat  │        │
│ │all    │   │Eye Open   │   │            │ │          │        │
│ │faces  │   │Confidence │   │Custom      │ │Optimize │        │
│ │       │   │           │   │Persistence │ │Frame    │        │
│ └──────┘    └───────────┘   └──────────┘   └─────────┘        │
│   │               │               │               │             │
│   │               │               │               │             │
│   └───────────────┼───────────────┼───────────────┘             │
│                   │               │                             │
│                   │        ┌──────▼──────┐                     │
│                   │        │FrameBuffer  │                     │
│                   │        │JPEG stream  │                     │
│                   │        │compression  │                     │
│                   │        └──────┬──────┘                     │
│                   │               │                             │
│                   └───────────────┼─────────────────┬───────┐   │
│                                   │                 │       │   │
│                          ┌────────▼────────┐   ┌───▼──┐    │   │
│                          │PresenceUpdate   │   │Frame │    │   │
│                          │Message Object   │   │Data  │    │   │
│                          │{status, faces,  │   │Base64│    │   │
│                          │ attention,      │   │JPEG  │    │   │
│                          │ performance,    │   │      │    │   │
│                          │ framePreview}   │   └──────┘    │   │
│                          └────────┬────────┘               │   │
│                                   │                        │   │
└───────────────────────────────────┼────────────────────────┼───┘
                                    │                        │
                              WebSocket                     Base64
                              Message                       Image
                                    │                        │
                                    └────────┬───────────────┘
                                             │
                            Broadcast to all connected Electron clients
```

## Data Flow Diagram - Presence Detection

```
┌─────────────────────────────────────────────────────────────────┐
│ INPUT: Video Stream from Webcam                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ WebcamHandler│
                  │ get_frame()  │
                  │ 30 fps input │
                  └──────┬───────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │ MultiFaceProcessor                │
         │ detect_faces(frame)               │
         │ • Find all faces in frame         │
         │ • Get bounding boxes              │
         │ • Extract face regions            │
         └─────────────┬─────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   ┌─────────────┐          ┌─────────────────┐
   │FaceEmbedding│          │AttentionDetector│
   │ Manager     │          │(MediaPipe)      │
   │             │          │                 │
   │Compare with │          │Each face:       │
   │stored faces │          │• Gaze direction │
   │             │          │• Head pose      │
   │Result:      │          │• Eyes open      │
   │registered?: │          │• Confidence     │
   │yes/no/unknown          └────────┬────────┘
   └────────┬────────┘                │
            │                         │
            └────────────┬────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │ analyze_presence()               │
        │ Logic:                           │
        │ IF registered_count == 1:        │
        │   status = "user_detected"       │
        │ IF unknown_count > 0:            │
        │   status = "unknown_detected"    │
        │ IF face_count > 1:               │
        │   status = "multiple_faces"      │
        │ IF face_count == 0:              │
        │   status = "no_face"             │
        └──────────┬───────────────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ PerformanceMonitor         │
      │ • Measure frame time       │
      │ • Track CPU/memory         │
      │ • Calculate FPS            │
      │ • Decide frame skip        │
      └────────────┬───────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ FrameBuffer                │
      │ • Compress to JPEG         │
      │ • Base64 encode            │
      │ • Apply detection boxes    │
      └────────────┬───────────────┘
                   │
                   ▼
      ┌───────────────────────────────────────┐
      │ Build PresenceUpdate Message          │
      │ {                                     │
      │   status: "user_detected",            │
      │   timestamp: 1704067200000,           │
      │   confidence: 0.95,                   │
      │   detectedFaces: 1,                   │
      │   faces: [{                           │
      │     id: "face_001",                   │
      │     position: {x, y, w, h},           │
      │     isRegisteredUser: true,           │
      │     confidence: 0.98                  │
      │   }],                                 │
      │   attention: {                        │
      │     status: "looking",                │
      │     gazeX: 0.05,                      │
      │     eyesOpen: true                    │
      │   },                                  │
      │   performanceMetrics: {               │
      │     cpuUsage: 8.5,                    │
      │     fps: 22                           │
      │   },                                  │
      │   framePreview: "data:image/jpeg..."  │
      │ }                                     │
      └────────────┬───────────────────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ WebSocket Broadcast        │
      │ Send to all Electron       │
      │ connected clients          │
      └────────────┬───────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ Electron receives message  │
      │ Update React state         │
      │ Components re-render       │
      │ UI updates in real-time    │
      └────────────────────────────┘
```

## Component State Tree

```
App (root)
└── Page
    ├── presenceData: PresenceUpdate
    │   ├── status: string
    │   ├── faces: FaceInfo[]
    │   ├── attention: AttentionData
    │   └── performanceMetrics: PerformanceData
    │
    ├── activeTab: 'dashboard' | 'preview' | 'filter' | 'performance'
    │
    ├── MainWindow (tab: dashboard)
    │   ├── config: AppConfig
    │   ├── privacyModeActive: boolean
    │   └── settingsPanel visible
    │
    ├── VideoPreview (tab: preview)
    │   ├── canvasRef: HTMLCanvasElement
    │   ├── frameData: base64 string
    │   └── detectionBoxes: Array<Box>
    │
    ├── MultiUserAlert
    │   ├── detectedFaces: FaceInfo[]
    │   └── visible: boolean (when > 1 face)
    │
    ├── AttentionIndicator
    │   ├── status: AttentionStatus
    │   ├── gazeDirection: {x, y}
    │   └── visible: boolean (when attention enabled)
    │
    ├── NotificationFilter
    │   ├── classifications: Map<string, sensitivity>
    │   └── selectedApp: string
    │
    └── PerformanceMonitor
        ├── metrics: PerformanceData
        ├── history: PerformanceData[]
        └── charts: {cpu, memory, fps}
```

## IPC Message Flow

### Sequence 1: User Toggles Privacy Mode

```
User clicks toggle in MainWindow
        │
        ▼
React setState(privacyModeActive = true)
        │
        ▼
MainWindow.handlePrivacyModeToggle()
        │
        ▼
electronAPI.setPrivacyMode(true)
        │
        ▼
Electron Preload → IPC send to main
        │
        ▼
Main Process IPC Handler
        │
        ▼
Python WebSocket receive message
        │
        ▼
handle_message('set_privacy_mode', {active: true})
        │
        ▼
Update config: privacyModeActive = true
        │
        ▼
Next frame processing:
notify_overlay_active = true
        │
        ▼
PresenceUpdate broadcast to Electron
        │
        ▼
Electron state updates
        │
        ▼
NotificationOverlay renders with blur
```

### Sequence 2: Setting App Notification Sensitivity

```
User selects app in NotificationFilter
        │
        ▼
User changes dropdown to "sensitive"
        │
        ▼
handleSensitivityChange('Gmail', 'sensitive')
        │
        ▼
electronAPI.send('set_app_sensitivity', {...})
        │
        ▼
Main Process IPC Handler
        │
        ▼
Python WebSocket receive message
        │
        ▼
NotificationClassifier.set_app_sensitivity(...)
        │
        ▼
Save to persistent storage
        │
        ▼
Send confirmation message
        │
        ▼
Electron updates UI ✓ checkmark
        │
        ▼
Next Gmail notification:
classifier.get_app_sensitivity('Gmail') → 'sensitive'
        │
        ▼
Decision: hide notification + activate overlay
```

## Performance Optimization Pipeline

```
┌────────────────────────────────────────────┐
│ Raw Frame from Camera (640x480, 30 fps)    │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Performance Monitor Assessment             │
│ • Check system CPU/memory                  │
│ • Estimate frame quality                   │
│ • Calculate if skip needed                 │
└────────────┬───────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
   YES               NO
 (Skip)          (Process)
   │                 │
   │            ┌────▼──────────────┐
   │            │ Face Detection    │
   │            │ Head Pose         │
   │            │ Gaze Tracking     │
   │            └────┬──────────────┘
   │                 │
   │            ┌────▼──────────────────┐
   │            │ Build Detection Data  │
   │            │ (FaceInfo arrays)     │
   │            └────┬──────────────────┘
   │                 │
   │            ┌────▼──────────────────┐
   │            │ Frame Compression     │
   │            │ Resize + JPEG Quality │
   │            │ 640x480 → 320x240     │
   │            └────┬──────────────────┘
   │                 │
   │            ┌────▼──────────────────┐
   │            │ Base64 Encode for IPC │
   │            └────┬──────────────────┘
   │                 │
   └────────────┬────┘
                │
                ▼
    ┌──────────────────────────┐
    │ PresenceUpdate Message   │
    │ with all new v2.0 data   │
    │ (optimized for size)     │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │ WebSocket Broadcast      │
    │ (optimized for latency)  │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │ Electron Receives        │
    │ Updates state            │
    │ Components re-render     │
    │ (only changed parts)     │
    └──────────────────────────┘
```

## Threading Model

### Python Backend

```
Main Thread:
├── WebSocket Server (async)
│   ├── Accept client connections
│   ├── Route incoming messages
│   └── Broadcast presence updates
│
└── Monitoring Loop (async coroutine)
    ├── WebcamHandler.get_frame()
    ├── MultiFaceProcessor.detect_faces()
    ├── AttentionDetector.detect_attention()
    ├── PerformanceMonitor.update()
    ├── NotificationClassifier checks
    └── Build & broadcast PresenceUpdate
        (runs at configurable frequency)
```

### Electron Main/Renderer

```
Main Thread:
├── Electron Main Process
│   ├── Create windows
│   ├── System tray
│   ├── IPC message routing
│   └── App lifecycle
│
└── WebSocket Client
    └── Send/receive messages from Python

Renderer Thread:
├── React Component Tree
├── State management
├── Real-time updates
└── CSS animations & blur effects
```

## Network Protocol

```
WebSocket Connection (ws://localhost:8765)

Frame 1 - Client Connect:
  → "Client connected"

Frame 2+ - Periodic Presence Updates (every 200ms):
  → {type: "presence_update", payload: {...}}

Frame N - Feature Control:
  ← {type: "set_app_sensitivity", payload: {...}}
  → {type: "sensitivity_updated", payload: {...}}

Frame M - Performance Query:
  ← {type: "get_performance_metrics"}
  → {type: "performance_data", payload: {...}}

Frame K - Health Check (every 5s):
  → {type: "health_check", payload: {...}}
  ← {type: "health_response", payload: {...}}
```

## Summary

This architecture achieves:
- **Low Latency**: WebSocket direct message, no polling
- **High Throughput**: 30 fps capture, 20+ fps update
- **Resource Efficiency**: Smart frame skipping, compression
- **Extensibility**: Modular design, easy to add features
- **Robustness**: Error handling, graceful degradation
- **Responsiveness**: React updates UI immediately

The v2.0 enhancement adds sophisticated intelligence layers while maintaining this clean, performant architecture.
