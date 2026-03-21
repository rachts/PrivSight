# Quick Start Guide

Get the Privacy Protector app running in 5 minutes.

## Prerequisites
- Node.js 18+ and pnpm
- Python 3.9+
- Webcam

## Installation & Launch

### 1. Install Dependencies (2 min)
```bash
# Install all packages
pnpm install

# Install Python packages
cd python
pip install -r requirements.txt
cd ..
```

### 2. Start Services (open 3 terminals)

**Terminal 1 - Python Backend:**
```bash
cd python
python -m server
# Expected: [Service] WebSocket server running on ws://localhost:8765
```

**Terminal 2 - Electron Renderer:**
```bash
cd electron
npm run dev:renderer
# Expected: VITE v5.0.0 ready in ... ms
```

**Terminal 3 - Electron Main:**
```bash
cd electron
npm run dev:main
# App window should open
```

### 3. Register Your Face
```bash
# In a new terminal
cd python
python register_face.py "Your Name"
# Stand in front of webcam, press SPACE to capture frames
# Press Q to cancel
```

### 4. Test It
1. Open the app if not already open
2. You should see "No Face Detected" status
3. Move your face in front of camera
4. Status should change to "Registered User Detected" (green)
5. Try with an unknown face - you'll see "Unknown Person Detected" (red) with blur overlay

## Key Commands

```bash
# Development
cd electron && npm run dev            # Full dev with HMR
cd electron && npm run build          # Build for production
cd python && python -m server         # Start Python service

# Face Management
cd python && python register_face.py "Name"  # Register face
cd python && python register_face.py "Name2" # Register another face

# Testing
cd python && pytest                   # Run tests (when added)

# Clean
pnpm clean                            # Remove node_modules
cd python && rm -rf __pycache__      # Clear Python cache
```

## Configuration

### Sensitivity (0-100)
- **Lower**: More lenient (higher confidence required)
- **Higher**: Stricter (any slight match hides notifications)
- Default: 80 (good balance)

### Update Frequency (100-1000ms)
- **Lower (100ms)**: More responsive but uses more CPU
- **Higher (1000ms)**: Less responsive but lighter
- Default: 200ms (recommended)

### Blur Intensity (0-100)
- **0**: No blur
- **50**: Medium blur
- **100**: Complete obstruction
- Default: 15 (subtle)

## Troubleshooting

### "WebSocket connection error"
```bash
# Make sure Python service is running
cd python && python -m server
# Should see: [Service] WebSocket server running on ws://localhost:8765
```

### "No face detected even with registered user"
```bash
# Check if face was registered
cd python && python register_face.py "Test Name"
# Recapture with better lighting

# Check if name matches what you want
python -c "from face_embeddings import FaceEmbeddingsManager; m = FaceEmbeddingsManager('data/face_embeddings.json'); print([f['name'] for f in m.get_registered_faces()])"
```

### "App won't start"
```bash
# Clear build cache
cd electron && rm -rf dist/ .vite/
npm run build

# Restart
npm run dev
```

### "Python import errors"
```bash
# Reinstall Python dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

## Features to Try

1. **Privacy Mode Toggle** - Manual privacy control regardless of detection
2. **Sensitivity Adjustment** - Change how strict face matching is
3. **Multiple Faces** - Register multiple people, each hides notifications
4. **Dark Mode** - Automatic dark theme (follows system)

## What's Next?

1. **Multi-User**: Register multiple users with different privacy levels
2. **App-Specific Privacy**: Hide only sensitive apps (email, banking)
3. **Eye Tracking**: Detect if you're actually looking at screen
4. **OS-Level Integration**: Deeper system integration on macOS/Windows

## File Structure Quick Reference

```
privacy-app/
├── electron/           # Desktop app (React + Electron)
├── python/             # Face recognition backend
├── shared/             # Shared types
├── README.md           # Full documentation
├── SETUP.md            # Development setup
├── DEPLOYMENT.md       # Build & distribution
└── PROJECT_OVERVIEW.md # Architecture details
```

## Getting Help

1. **Issues with setup?** → See SETUP.md
2. **Building for release?** → See DEPLOYMENT.md
3. **Understanding architecture?** → See PROJECT_OVERVIEW.md
4. **General questions?** → See README.md

## Performance Tips

- **Reduce update frequency** if CPU usage is high (e.g., 500ms instead of 200ms)
- **Lower resolution** if webcam feed lags (currently 320x240)
- **Increase sensitivity** if detection is too strict
- **Decrease blur intensity** if performance suffers

## System Requirements

- RAM: 256MB minimum (500MB+ recommended)
- Disk: 500MB for dependencies
- CPU: 2+ cores recommended
- Webcam: USB or built-in

## Next Steps

1. Explore settings and adjust to preferences
2. Register multiple faces if shared computer
3. Test with different lighting conditions
4. Monitor CPU/memory usage
5. Report any issues

---

**Estimated Setup Time**: 5-10 minutes
**Estimated First Use**: 15 minutes (including face registration)
**Support**: Check documentation files or GitHub Issues
