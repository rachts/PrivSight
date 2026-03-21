# Privacy App v2.0 - Testing Guide

## Test Environment Setup

### Requirements

- Python 3.9+
- Node.js 16+
- Webcam (physical or virtual)
- 4GB+ RAM
- 50MB disk space

### Installation

```bash
# Clone and setup
git clone <repo>
cd privacy-app

# Python setup
cd python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Electron setup
cd ../electron
npm install

# Return to root
cd ..
```

## Running the Application

### Terminal 1: Python Backend

```bash
cd python
python -m server
# Expected output: [Service] WebSocket server running on ws://localhost:8765
```

### Terminal 2: Electron Renderer Dev

```bash
cd electron
npm run dev:renderer
# Expected output: Vite dev server running on http://localhost:5173
```

### Terminal 3: Electron Main Process

```bash
cd electron
npm run dev:main
# Expected output: Application window opens
```

## Test Scenarios

### Test 1: Single Face Detection

**Objective:** Verify registered face is detected correctly

**Steps:**
1. Start application
2. Position registered user in front of camera
3. Verify in UI:
   - Status shows "User Detected"
   - Confidence score > 0.7
   - Face count = 1
   - Notifications visible

**Expected Result:** ✓ PASS

---

### Test 2: Multiple Face Detection (Shoulder Surfing)

**Objective:** Verify system detects unauthorized persons

**Steps:**
1. Start application with registered user in frame
2. Have another person enter camera view
3. Verify in UI:
   - Multi-user alert appears
   - Shows "2 faces detected"
   - Displays "Unknown" for new person
   - Notifications are hidden
   - Yellow/red warning displayed

**Expected Result:** ✓ PASS

---

### Test 3: Attention Detection (Looking Away)

**Objective:** Verify gaze detection works

**Steps:**
1. Start with user looking at screen
2. Verify in Attention Indicator:
   - Status shows "User Looking"
   - Green indicator active
3. Turn head away from screen
4. Verify:
   - Status changes to "Not Looking"
   - Indicator turns red
   - Notifications hidden

**Expected Result:** ✓ PASS

---

### Test 4: Notification Classification

**Objective:** Verify app sensitivity filtering works

**Steps:**
1. Open Notification Filter tab
2. Find "Gmail" in Sensitive category
3. Click it to change to "Moderate"
4. Click again to change to "Public"
5. Verify settings persist after restart

**Expected Result:** ✓ PASS

---

### Test 5: Live Preview Streaming

**Objective:** Verify camera feed streams correctly

**Steps:**
1. Enable "Live Preview" in settings
2. Verify in VideoPreview component:
   - Camera feed displays
   - Updates smoothly (15 fps)
   - Shows detection boxes if enabled
3. Move face around
4. Verify feed updates in real-time

**Expected Result:** ✓ PASS

---

### Test 6: Performance Monitoring

**Objective:** Verify system stays under 10% CPU

**Steps:**
1. Open Performance Monitor tab
2. Let app run for 2 minutes
3. Check metrics:
   - CPU Usage < 10%
   - Memory < 200MB
   - FPS > 15
   - Latency < 100ms
4. Enable all features
5. Verify metrics still acceptable

**Expected Result:** ✓ PASS

---

### Test 7: Frame Quality Detection

**Objective:** Verify system skips poor quality frames

**Steps:**
1. Start application in dark room
2. Gradually brighten lighting
3. Watch frame skip rate in Performance Monitor
4. Verify:
   - High skip rate in darkness
   - Lower skip rate with good lighting
   - CPU stays stable

**Expected Result:** ✓ PASS

---

### Test 8: No Face Detected

**Objective:** Verify graceful handling when face missing

**Steps:**
1. Start application
2. Move away from camera
3. Verify in UI:
   - Status shows "No Face"
   - Notifications are hidden
   - No errors in console

**Expected Result:** ✓ PASS

---

### Test 9: Configuration Changes

**Objective:** Verify settings apply correctly

**Steps:**
1. Open Settings tab
2. Change sensitivity from 80 to 50
3. Change update frequency from 200ms to 100ms
4. Change blur intensity from 15 to 40
5. Verify:
   - Changes apply immediately
   - Faster updates with 100ms frequency
   - Settings persist after restart

**Expected Result:** ✓ PASS

---

### Test 10: IPC Communication

**Objective:** Verify data flows correctly between Python and Electron

**Steps:**
1. Open developer tools (Cmd+I on Mac)
2. Check Console tab
3. Look for IPC debug logs
4. Verify messages being sent/received:
   - presence_update every 200ms
   - performance_metrics updates
   - frame_preview updates
5. Check for any JSON parse errors

**Expected Result:** ✓ PASS

---

## Performance Tests

### CPU Usage Test

```bash
# Method 1: Monitor in PerformanceMonitor component
# - Record CPU % for 5 minutes
# - Calculate average
# - Should be < 10%

# Method 2: System monitoring
# macOS: Activity Monitor > Privacy App process
# Windows: Task Manager > Privacy App
# Linux: top | grep python
```

### Memory Usage Test

```bash
# Expected: 140-200MB total
# Monitor for memory leaks:
# 1. Run for 1 hour continuously
# 2. Check memory doesn't increase over time
# 3. Should remain stable ±10MB
```

### Frame Processing Test

```bash
# Verify FPS in PerformanceMonitor:
# - Should be 15-30 fps for face detection
# - Should be configurable preview FPS (5-30)
# - Latency should be < 100ms per frame
```

## Stress Tests

### Test: Rapid Face Detection Changes

```
1. Start application
2. Rapidly move in/out of frame
3. Bring another person in quickly
4. Remove person
5. Verify no crashes or lag
6. Check console for errors
```

### Test: Extended Runtime

```
1. Start application
2. Let run for 4+ hours
3. Monitor:
   - CPU usage remains stable
   - Memory doesn't leak
   - No performance degradation
   - No errors in logs
```

### Test: Multiple Feature Activation

```
1. Enable all features:
   - Multi-face detection
   - Attention detection
   - Live preview
   - Performance monitoring
2. Run for 30 minutes
3. Verify CPU stays below 15%
```

## Integration Tests

### Test: App Sensitivity Persistence

```
1. Set Gmail to "Public"
2. Set Slack to "Sensitive"
3. Restart application
4. Verify settings are preserved
```

### Test: Multi-Face Tracking

```
1. Register 2 users
2. Have both in frame
3. Verify both show "Registered"
4. Introduce third person
5. Verify unknown person detected
```

### Test: Attention + Multi-Face Combo

```
1. Have 2 registered users in frame
2. One looking at screen, one away
3. Verify:
   - Notifications shown (2 registered)
   - Attention shows "looking" for active user
   - Attention shows "uncertain" for turned-away user
```

## Edge Cases

### Test: Partial Face in Frame

```
Scenario: User enters frame gradually
- Half face visible: Detection may fail
- Full face visible: Should detect
- Expected: System handles gracefully
```

### Test: Multiple Faces, All Unknown

```
Scenario: Stranger + friend (not registered)
- Should detect 2 faces
- Both show as unknown
- Should hide notifications
```

### Test: Lighting Transitions

```
Scenario: User moves between light and dark areas
- Bright (>200 lux): Good detection
- Medium (50-200 lux): Acceptable
- Dark (<50 lux): May skip frames
- Expected: System adapts with frame skipping
```

### Test: Camera Rotation/Zoom

```
Scenario: Webcam height/angle changes
- System should auto-adjust to new frame
- Face landmarks may be off initially
- Expected: Recalibrates within 1-2 seconds
```

## Regression Tests

### Critical Features to Test After Changes

- [ ] Face registration still works
- [ ] Single user detection works
- [ ] Multi-face detection works
- [ ] Notification overlay appears/disappears
- [ ] Privacy mode toggle works
- [ ] System doesn't crash on start
- [ ] No memory leaks over 30 minutes

### After Python Changes

```bash
cd python
python -m pytest tests/  # If tests exist
```

### After Electron Changes

```bash
cd electron
npm run build
npm run build:main
```

## Debugging Tips

### Enable Debug Logging

```python
# In server.py
logging.basicConfig(level=logging.DEBUG)

# In Python modules
logger.debug(f"[Module] Debug info: {variable}")
```

### Check IPC Communication

```javascript
// In Electron console
window.electronAPI.onPresenceUpdate((data) => {
  console.log('[IPC] Received:', data);
});
```

### Inspect WebSocket Messages

```python
# In server.py monitoring_loop
print(f"[Debug] Sending message: {json.dumps(message, indent=2)}")
```

### View Frame Quality

```python
# In server.py
quality = performance_monitor.estimate_frame_quality(frame)
print(f"[Debug] Frame quality: {quality:.2f}")
```

## Success Criteria

### All Tests Must Pass

- ✓ Single face detection works
- ✓ Multi-face detection works
- ✓ Attention detection works
- ✓ Notification filtering works
- ✓ Live preview streams
- ✓ Performance < 10% CPU
- ✓ Memory < 200MB
- ✓ No crashes in 1-hour run
- ✓ No memory leaks
- ✓ IPC communication stable

### Performance Benchmarks

- CPU Usage: < 10% average
- Memory: 140-200MB stable
- FPS: 15-30 for processing
- Latency: < 100ms per frame
- Preview: 15 fps streaming

## Test Report Template

```markdown
# Test Report - Privacy App v2.0

**Date:** 2024-03-12
**Tester:** [Name]
**System:** [OS, CPU, RAM]

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Single Face | ✓ PASS | - |
| Multi-Face | ✓ PASS | - |
| Attention | ✓ PASS | - |
| ... | | |

## Performance Metrics

- Average CPU: 7.3%
- Peak Memory: 185MB
- Average FPS: 22
- Latency: 45ms

## Issues Found

None

## Sign-off

- Tester: [Name]
- Date: 2024-03-12
```

