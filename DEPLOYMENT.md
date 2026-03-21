# Deployment & Distribution Guide

**Created by Rachit**

## Overview

This guide covers building, packaging, and distributing PRIVSIGHT v2.0 for macOS and Windows.

## Prerequisites

- Node.js 18+ and pnpm installed
- Python 3.9+ installed
- Code signing certificates (optional, for production)
- Notarization credentials (for macOS release)

## Building

### Step 1: Build All Packages

```bash
# From project root
pnpm build

# This builds:
# - Electron main and renderer
# - Python modules (pre-compiled if using PyInstaller)
# - All assets and resources
```

### Step 2: Generate Installers

#### macOS

```bash
cd electron

# Build DMG and ZIP installers
npm run build:mac

# Output:
# - dist/Privacy\ Protector-*.dmg (installer)
# - dist/Privacy\ Protector-*.zip (portable)
```

#### Windows

```bash
cd electron

# Build NSIS and Portable installers
npm run build:win

# Output:
# - dist/Privacy Protector Setup *.exe (installer)
# - dist/Privacy Protector *.exe (portable)
```

#### Cross-Platform

```bash
cd electron

# Build both platforms (requires native toolchains)
npm run build:all
```

## Configuration

### Electron Builder Configuration

Located in `electron/package.json` under `build`:

```json
{
  "build": {
    "appId": "com.privacy-app.desktop",
    "productName": "Privacy Protector",
    "directories": {
      "buildResources": "assets"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.utilities"
    },
    "win": {
      "target": ["nsis", "portable"],
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

### Customization

Edit these values for your build:

- `appId`: Unique identifier (reverse domain notation)
- `productName`: Display name in installers
- `categories`: Linux app categories
- `Mac-specific`: Code signing, hardened runtime, etc.
- `Windows-specific`: Certificate, installer options

## Platform-Specific Build Steps

### macOS Build

#### Prerequisites
- Xcode Command Line Tools: `xcode-select --install`
- Mac App Store account for distribution certificate

#### Create Code Signing Certificate

```bash
# Using Xcode
open /Applications/Xcode.app/Contents/Applications/Application\ Loader.app/Contents/Frameworks/ITunesSoftwareService.framework/Support/altool

# Or use Apple Developer Portal
# Navigate to: Certificates, Identifiers & Profiles > Certificates
# Create new Developer ID Application certificate
```

#### Update electron/package.json

```json
{
  "build": {
    "mac": {
      "signingIdentity": "Developer ID Application: Your Name (ID)",
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "hardenedRuntime": true,
      "gatekeeperAssess": false
    }
  }
}
```

#### Create entitlements.mac.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
</dict>
</plist>
```

#### Build and Notarize

```bash
# Build
npm run build:mac

# Notarize (Apple requirement for distribution)
xcrun notarytool submit dist/Privacy\ Protector-*.dmg \
  --apple-id your-apple-id@example.com \
  --password app-specific-password \
  --team-id XXXXXXXXXXXX
```

### Windows Build

#### Prerequisites
- Visual Studio Build Tools or Visual C++ Build Tools
- Windows code signing certificate (.pfx file) for production

#### Development Build (Unsigned)

```bash
cd electron
npm run build:win
```

#### Production Build (Signed)

1. Obtain code signing certificate from:
   - DigiCert
   - Sectigo
   - Other Windows-trusted certificate authorities

2. Update `electron/package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your-password",
      "signingHashAlgorithms": ["sha256"],
      "sign": "./customSign.js"
    }
  }
}
```

3. Create `electron/customSign.js`:

```javascript
const path = require('path');
const { execSync } = require('child_process');

module.exports = async (configuration) => {
  if (!configuration.isNsis) return;

  const exePath = configuration.path;
  const certPath = process.env.SIGNING_CERT || 'path/to/cert.pfx';
  const certPassword = process.env.SIGNING_PASSWORD || '';

  try {
    await execSync([
      'signtool.exe', 'sign',
      '/f', certPath,
      '/p', certPassword,
      '/tr', 'http://timestamp.digicert.com',
      '/td', 'sha256',
      exePath
    ].join(' '));
  } catch (e) {
    console.error('Signing failed:', e);
    throw e;
  }
};
```

#### Build

```bash
cd electron
npm run build:win
```

## Distribution

### Direct Distribution

1. **Upload to website**: Host installers on your server
2. **GitHub Releases**: Use GitHub for version hosting
3. **Package managers**:
   - macOS: Homebrew
   - Windows: Chocolatey, WinGet

### GitHub Release

```bash
# Create GitHub release with installers
# Attach:
# - Privacy Protector-*.dmg
# - Privacy Protector Setup *.exe
# - Privacy Protector *.exe (portable)
# - RELEASES file
# - Latest release notes
```

### Auto-Update

Configure `electron-updater` in `electron/main/updates.ts`:

```typescript
import { autoUpdater } from 'electron-updater';

export const setupAutoUpdates = () => {
  autoUpdater.checkForUpdatesAndNotify();
};
```

Configure in `electron/package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-org",
      "repo": "privacy-app"
    }
  }
}
```

## Python Runtime Distribution

### Option 1: PyInstaller (Recommended for MVP)

```bash
cd python

# Create PyInstaller spec
pyi-makespec \
  --onefile \
  --name privacy-server \
  --add-data 'data:data' \
  server.py

# Build executable
pyinstaller privacy-server.spec

# Result: dist/privacy-server (executable)
```

Update `electron/package.json` to bundle Python:

```json
{
  "build": {
    "files": [
      "dist/**/*",
      "python/dist/privacy-server"
    ]
  }
}
```

### Option 2: Subprocess Launch (Simple)

Keep Python service separate and launch from Electron:

```typescript
// electron/src/main/index.ts
import { spawn } from 'child_process';

const startPythonService = () => {
  const pythonPath = process.env.PYTHON_PATH || 'python3';
  const serverPath = path.join(__dirname, '../../python/server.py');

  spawn(pythonPath, [serverPath], {
    stdio: 'pipe',
    detached: true
  });
};
```

### Option 3: Conda Bundle

For complex dependencies:

```bash
# Create conda environment
conda create -n privacy-app python=3.9 opencv face-recognition

# Package with PyInstaller
pyinstaller --onefile --paths=/path/to/conda/env server.py
```

## Testing Before Release

### Quality Checklist

- [ ] Fresh install on clean system
- [ ] First-run experience works smoothly
- [ ] Face registration completes
- [ ] Notifications blur correctly
- [ ] Performance is acceptable (CPU, memory)
- [ ] No console errors in DevTools
- [ ] Settings persist between restarts
- [ ] Uninstall leaves no artifacts

### Stress Testing

```bash
# Test with multiple faces
python python/register_face.py "Test User 2"

# Monitor system resources
# - CPU usage during detection
# - Memory usage over time
# - Battery impact (mobile scenarios)
```

### Integration Testing

```bash
# Test IPC communication
npm run test:ipc

# Test Python service
python -m pytest python/

# Test Electron build
npm run test:electron
```

## Version Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Increment Version

```bash
# Update version in electron/package.json
# Update version in python/pyproject.toml
# Create git tag
git tag v0.2.0
git push origin v0.2.0

# Create GitHub Release with tag
```

## Release Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Version updated
- [ ] Changelog updated
- [ ] Build succeeds for all platforms
- [ ] Installers tested on fresh systems
- [ ] Code signed (production)
- [ ] Notarized (macOS production)
- [ ] Release notes prepared
- [ ] GitHub/website updated
- [ ] Users notified of update

## Troubleshooting

### Build Errors

**"Cannot find module 'ws'"**
```bash
cd electron
npm install
```

**"OpenCV not found"**
```bash
cd python
pip install --upgrade opencv-python
```

### Distribution Issues

**"App not trusted" (Windows)**
- Need code signing certificate
- Users can run anyway (click "More info")

**"Unexpected error" (macOS)**
- Run Gatekeeper bypass:
  ```bash
  xattr -d com.apple.quarantine /Applications/Privacy\ Protector.app
  ```

**"Too slow to start"**
- Check if Python service is launching
- Reduce initial frame processing in `webcam_handler.py`

## License & Compliance

- Ensure compliance with face-recognition library licenses
- Include THIRD_PARTY_LICENSES.txt in distribution
- OpenCV: 3-clause BSD License
- face-recognition: MIT License

## Next Steps

1. Create GitHub releases for each version
2. Set up auto-update server
3. Monitor user feedback and crash reports
4. Plan for feature releases
5. Consider app store distribution (App Store, Microsoft Store)

---

For support or issues with deployment, check GitHub Issues or reach out to the development team.
