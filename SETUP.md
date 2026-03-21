# Development Setup Guide

**PRIVSIGHT v2.0 - Created by Rachit**

## Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **Python**: 3.9 or higher
- **pnpm**: 8.0.0 or higher (for monorepo management)
- **Webcam**: For facial recognition functionality

### Installation

#### 1. Install Node.js and pnpm
```bash
# Install Node.js from https://nodejs.org/ (LTS recommended)

# Install pnpm globally
npm install -g pnpm

# Verify installation
node --version
pnpm --version
```

#### 2. Install Python 3.9+
```bash
# macOS (using Homebrew)
brew install python@3.9

# Windows - download from https://www.python.org/downloads/
# Linux
sudo apt-get install python3.9 python3.9-dev

# Verify installation
python3 --version
```

## Project Setup

### Step 1: Clone and Install Dependencies

```bash
# Navigate to project directory
cd privacy-app

# Install root and workspace dependencies
pnpm install

# This will install:
# - Electron and React dependencies in electron/
# - Python dependencies listed in python/requirements.txt
```

### Step 2: Install Python Dependencies

```bash
cd python

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt

# Verify installation
python3 -c "import cv2; import face_recognition; print('✓ All Python dependencies installed')"

cd ..
```

### Step 3: Start Development Environment

Open three terminals in the project root:

#### Terminal 1: Python Backend
```bash
cd python
# Activate virtual environment if used above
python3 -m server
```
You should see: `[Service] WebSocket server running`

#### Terminal 2: Electron Renderer (React)
```bash
cd electron
npm run dev:renderer
```
You should see: `VITE v5.0.0 ready in ... ms`

#### Terminal 3: Electron Main Process
```bash
cd electron
npm run dev:main
```

The Electron app should launch with the Renderer at http://localhost:5173

## Verification

### Quick Test

1. **Python Backend**
   - Should print: `[Service] WebSocket server running on ws://localhost:8765`
   - Check: Can you see presence detection logs?

2. **Electron App**
   - Should show: Dashboard with "No Face Detected" status
   - Check: Can you move your face in front of webcam?
   - Expected: Status changes to show face detection

3. **Face Registration**
   - This feature should be added in Phase 3 (Settings)
   - For now, manual face embedding registration is coming

### Troubleshooting Setup

#### Python Import Errors
```bash
# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +

# Reinstall in clean environment
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

#### OpenCV/dlib Issues (macOS)
```bash
# If you see build errors, try Homebrew first
brew install opencv

# Or use pre-built binary
pip install opencv-python-headless
```

#### Electron Port Already in Use
```bash
# Kill process on port 5173
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

#### Python Port Already in Use
```bash
# Kill process on port 8765
# macOS/Linux
lsof -ti:8765 | xargs kill -9

# Windows
netstat -ano | findstr :8765
taskkill /PID <PID> /F
```

## Development Commands

### Electron Commands
```bash
cd electron

npm run dev           # Run dev with hot reload
npm run build         # Build production bundles
npm start             # Run built app
npm run type-check    # Check TypeScript errors
npm run build:main    # Build main process only
npm run build:renderer # Build renderer only
```

### Python Commands
```bash
cd python

python -m server      # Start WebSocket server
python -m pytest      # Run tests (when added)
```

## File Structure During Development

```
privacy-app/
├── electron/
│   ├── src/
│   │   ├── main/
│   │   │   ├── index.ts          # Main process entry
│   │   │   ├── preload.ts        # Context bridge
│   │   │   ├── ipc-handlers.ts  # IPC communication
│   │   │   └── tray.ts          # Tray integration
│   │   └── renderer/
│   │       ├── App.tsx           # Root component
│   │       ├── components/       # React components
│   │       ├── styles.css        # Global styles
│   │       └── utils.ts          # Utilities
│   ├── index.html                # Entry HTML
│   ├── vite.config.ts            # Vite config
│   ├── tsconfig.json             # TypeScript config
│   └── package.json              # Dependencies
│
├── python/
│   ├── server.py                 # WebSocket server
│   ├── face_embeddings.py        # Face recognition
│   ├── webcam_handler.py         # Camera capture
│   ├── notification_monitor.py   # Presence logic
│   ├── requirements.txt          # Python dependencies
│   └── pyproject.toml            # Python config
│
├── shared/
│   └── types.ts                  # Shared TypeScript types
│
└── README.md                     # Project overview
```

## Hot Reload Development

### React Component Changes
- Save `.tsx` files in `electron/src/renderer/`
- Vite automatically reloads browser

### Python Service Changes
- Save `.py` files in `python/`
- Restart `python -m server` in Terminal 1
- Electron will reconnect automatically

### Electron Main Process Changes
- Save `.ts` files in `electron/src/main/`
- Auto-restart via `tsx watch` in Terminal 3

## Building for Production

### Step 1: Build All Packages
```bash
pnpm build
```

### Step 2: Package Electron App
```bash
cd electron

# macOS
npm run build:electron:mac

# Windows  
npm run build:electron:win

# Both
npm run build:electron
```

### Step 3: Find Installers
```bash
# Built files in:
electron/dist/
```

## Environment Variables

### Python Backend
Create `.env` in `python/` (optional):
```env
SERVER_HOST=localhost
SERVER_PORT=8765
LOG_LEVEL=INFO
```

### Electron App
Create `.env` in `electron/` (optional):
```env
VITE_PYTHON_WS_URL=ws://localhost:8765
```

## Next Steps

1. **Register Your Face** (coming in Phase 3)
   - Settings panel will have face registration
   - Capture 5-10 frames from different angles
   - System generates facial embeddings

2. **Test Detection**
   - Registered user in frame → notifications visible
   - Unknown face in frame → notifications blurred
   - No face in frame → notifications blurred

3. **Customize Settings**
   - Adjust sensitivity for strict matching
   - Change update frequency for responsiveness
   - Set blur intensity for privacy

## Support

- Check logs in both terminals for errors
- Make sure Python service is running
- Ensure webcam permissions are granted
- Try restarting if connection drops

## Common Development Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `pnpm install` again |
| WebSocket connection error | Check Python service is running on port 8765 |
| No video feed | Grant webcam permissions to Electron |
| High CPU usage | Reduce update frequency in settings |
| Webcam locked by another app | Close other camera apps |

---

For detailed project information, see [README.md](./README.md)
