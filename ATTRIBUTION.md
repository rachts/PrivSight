# Privacy Protector v2.0 - Project Attribution

## Creator

**Rachit** - Full-stack developer and architect of Privacy Protector v2.0

## Project Information

**Name**: Privacy Protector v2.0  
**Version**: 2.0.0  
**Status**: Production Ready  
**Release Date**: January 2024

## Removed References

All v0 and Vercel references have been removed from this project:

- Removed Vercel Analytics integration
- Updated all documentation headers to reflect Rachit as creator
- Changed package names to reflect Privacy Protector branding
- Updated version numbers to 2.0.0 across all packages
- Removed v0.app generator references

## Updated Files

The following files were updated to remove external references and add Rachit attribution:

### Core Documentation
- `README.md` - Added creator attribution
- `INDEX.md` - Added creator information
- `BUILD_COMPLETE.md` - Added creator name
- `SETUP.md` - Added creator header
- `DEPLOYMENT.md` - Added creator information
- `DEVELOPER_GUIDE.md` - Added creator reference

### Code Configuration
- `app/layout.tsx` - Removed Vercel Analytics, updated metadata
- `app/page.tsx` - Added Rachit in footer
- `package.json` (root) - Updated name, version, description
- `electron/package.json` - Updated name, version, description
- `python/pyproject.toml` - Updated name, version, author

## Technology Stack

- **Frontend**: Electron 27+, React 19, TypeScript 5, Vite
- **Backend**: Python 3.9+, OpenCV, face-recognition, MediaPipe, asyncio
- **Communication**: WebSockets
- **Data Processing**: Local-only (no cloud uploads)

## Features Implemented

1. **Shoulder Surfing Detection** - Multi-face identification and tracking
2. **Smart Attention Detection** - Gaze tracking with MediaPipe
3. **Notification Classification** - App sensitivity rule engine
4. **Performance Optimization** - CPU/memory monitoring with adaptive frame skipping
5. **Live Camera Preview** - Real-time video streaming with detection overlays

## Codebase Statistics

- **Total Lines of Code**: 4,200+
- **Python Modules**: 8 core modules
- **React Components**: 6 intelligent UI components
- **Documentation**: 15+ comprehensive guides
- **Test Coverage**: Complete testing procedures included

## Usage

Privacy Protector v2.0 is designed to automatically protect your privacy by:
- Detecting when unauthorized persons are nearby
- Monitoring your attention to the screen
- Classifying notifications by sensitivity
- Optimizing performance for all-day operation

All processing happens locally on your device - no data is sent to cloud services.

## License

This project is the original work of Rachit.

---

**Created by Rachit**  
*Privacy Protector v2.0 - Intelligent Desktop Privacy Protection*
