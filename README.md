# PRIVSIGHT v2.0

A cross-platform desktop application that monitors facial recognition to control notification visibility and protect your privacy. When unauthorized people are present, notifications are automatically blurred or hidden.

**Created by Rachit**

## Features

- **Facial Recognition**: Detects and recognizes registered users via webcam
- **Intelligent Notification Blurring**: Automatically blurs/hides notifications when unknown people are present
- **Privacy Mode**: Manual toggle for complete notification privacy
- **Real-time Presence Detection**: Continuous monitoring with configurable sensitivity
- **System Tray Integration**: Always-on status indicator in system tray
- **Cross-Platform**: Supports macOS and Windows
- **Local Processing**: All face data processing happens locally - no cloud uploads

## Architecture

### Monorepo Structure
```
privacy-app/
├── electron/                    # Electron desktop application (React + TypeScript)
├── python/                      # Python face recognition backend
├── shared/                      # Shared TypeScript types
└── README.md
```

### Technology Stack

**Frontend (Electron)**
- Electron 27+ for desktop integration
- React 19 for UI
- TypeScript for type safety
- Vite for fast development builds

**Backend (Python)**
- OpenCV for face detection
- face-recognition for facial encoding
- websockets for IPC communication
- asyncio for async operations

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.9+
- Webcam access

### Installation

1. **Clone and setup**
```bash
# Install dependencies
pnpm install

# Install Python dependencies
cd python
pip install -r requirements.txt
cd ..
```

2. **Start development**

Open two terminals:

**Terminal 1 - Python Backend:**
```bash
cd python
python -m server
```

**Terminal 2 - Electron App:**
```bash
cd electron
npm run dev
```

The Electron app will start on http://localhost:5173 with hot reload.

### Building

```bash
# Build both applications
pnpm build

# Package for macOS or Windows
cd electron
npm run build
```

## Usage

### Initial Setup

1. Open the app and register your face
   - The system will capture several frames of your face
   - These are converted to facial embeddings (mathematical representations)
   - Embeddings are stored locally

2. Configure sensitivity settings
   - **Sensitivity**: How strict face matching should be (0-100%)
   - **Update Frequency**: How often to check (100-1000ms)
   - **Blur Intensity**: Strength of notification blur effect

### Operation

- **Registered User Detected**: Notifications appear normally
- **No Face Detected**: Notifications are blurred/hidden
- **Unknown Face Detected**: Notifications are blurred/hidden
- **Multiple Faces**: Notifications are blurred/hidden (shoulder surfing protection)

### Privacy Mode

Toggle "Privacy Mode" in the UI to manually hide notifications regardless of detection status.

## Development

### Project Structure

**Electron App** (`electron/src/`)
```
main/                           # Electron main process
├── index.ts                    # App entry, window management
├── preload.ts                  # Secure context bridge
├── ipc-handlers.ts             # Python communication
└── tray.ts                     # System tray integration

renderer/                       # React UI
├── App.tsx                     # Root component
├── components/
│   ├── MainWindow.tsx          # Dashboard
│   └── NotificationOverlay.tsx  # Privacy blur layer
├── utils.ts                    # Helper functions
└── styles.css                  # Global styles
```

**Python Backend** (`python/`)
```
server.py                       # WebSocket server
face_embeddings.py              # Face recognition engine
webcam_handler.py               # Camera capture
notification_monitor.py         # Presence logic
requirements.txt                # Dependencies
pyproject.toml                  # Project config
```

### IPC Protocol

Communication between Electron and Python uses JSON over WebSocket at `ws://localhost:8765`:

```json
{
  "type": "presence_update",
  "payload": {
    "status": "user_detected",
    "timestamp": 1234567890,
    "confidence": 0.95,
    "detectedFaces": 1
  }
}
```

### Status Values

- `user_detected`: Registered user recognized
- `unknown_detected`: Unknown face detected
- `multiple_faces`: More than one face
- `no_face`: No faces detected
- `error`: Detection error occurred

## Configuration

### App Settings

Stored in Electron memory and sent to Python service:

```typescript
{
  sensitivity: number;      // 0-100, face matching threshold
  updateFrequency: number;  // ms between updates
  blurIntensity: number;    // 0-100, blur strength
  autoStart: boolean;       // Launch at system boot
  privacyModeActive: boolean;
}
```

### Environment Variables

**Python Backend:**
- `SERVER_HOST`: WebSocket server host (default: `localhost`)
- `SERVER_PORT`: WebSocket server port (default: `8765`)

**Electron App:**
- `PYTHON_WS_URL`: Python service URL (default: `ws://localhost:8765`)

## Security

### Data Privacy

- All face processing happens locally on your machine
- Face embeddings are stored locally in JSON format
- No data is sent to cloud services
- No internet connection required

### Future Enhancements

- Add AES encryption for stored embeddings
- Implement secure storage with OS keychain
- Add activity logging

## Known Limitations

### Current MVP

- Software overlay only (future: OS-level notification APIs)
- Single registered user only
- Frame processing at reduced resolution (320x240)

### Planned Improvements

- Multi-user support with roles
- App-specific privacy (hide sensitive apps)
- Eye tracking for true focus detection
- Shoulder surfing detection (advanced face count handling)
- Auto-lock on user absence
- Integration with macOS Focus/Windows Focus Assist

## Troubleshooting

### Python Service Won't Start

```bash
# Check if dependencies are installed
python -m pip install -r requirements.txt

# Test OpenCV installation
python -c "import cv2; print(cv2.__version__)"

# Test face_recognition
python -c "import face_recognition; print('OK')"
```

### Webcam Not Detected

- Check system permissions for webcam access
- Try camera index 0, 1, 2 in `python/webcam_handler.py`
- Restart application to refresh device list

### No Faces Detected

- Ensure good lighting
- Face must be clearly visible to camera
- Try adjusting sensitivity slider
- Check camera feed in MainWindow

### Performance Issues

- Reduce update frequency (higher ms value)
- Lower resolution in webcam settings
- Close other CPU-intensive applications

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Submit pull request

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**PRIVSIGHT** - Intelligent Privacy Protection for Your Desktop. Protect your screen from prying eyes.
