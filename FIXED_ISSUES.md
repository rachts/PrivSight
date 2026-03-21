# Fixed Preview Issues

## Problems Fixed

### 1. Missing Props & State Management
- **Issue**: App.tsx was not passing state to Page component
- **Fix**: Updated App.tsx to pass `appState`, `onSettingsUpdate`, and `onPrivacyModeToggle` props
- **Result**: Page now receives all necessary state and callbacks

### 2. Page Component Props
- **Issue**: page.tsx didn't accept props from App
- **Fix**: Added proper `PageProps` interface and destructured all props
- **Result**: Page can now pass data to child components

### 3. MainWindow Props
- **Issue**: Missing `onPresenceUpdate` callback prop
- **Fix**: Added `onPresenceUpdate?: (data: PresenceUpdate) => void` to interface
- **Result**: Dashboard updates trigger parent state updates

### 4. VideoPreview Component
- **Issue**: Missing `detectedFaces` prop that page.tsx tries to pass
- **Fix**: Added `FaceInfo[]` prop with default empty array
- **Result**: Video preview can now display face detection overlays

### 5. NotificationFilter Component
- **Issue**: Missing `presenceData` prop
- **Fix**: Added `PresenceUpdate | null` prop to interface
- **Result**: Filter tab can access real-time presence data

### 6. PerformanceMonitor Component
- **Issue**: Expected `data` prop but page passes `metrics`
- **Fix**: Changed prop name from `data` to `metrics`, fixed all references
- **Result**: Performance monitor displays correct metrics

### 7. Component Data References
- **Issues**: Multiple components still referenced old prop names
- **Fixes**: 
  - Changed `data.cpuUsage` → `metrics.cpuUsage`
  - Changed `data.fps` → `metrics.fps`
  - Changed `data.memoryUsage` → `metrics.memoryUsage`
  - Changed `data.processingTime` → `metrics.processingTime`
  - Changed `data.frameSkipRate` → `metrics.frameSkipRate`
- **Result**: All metric references now use correct prop name

## Files Modified

1. **App.tsx** - Added props to Page component
2. **page.tsx** - Added PageProps interface and component signature
3. **MainWindow.tsx** - Added onPresenceUpdate prop
4. **VideoPreview.tsx** - Added detectedFaces prop
5. **NotificationFilter.tsx** - Added presenceData prop
6. **PerformanceMonitor.tsx** - Fixed all prop references from data → metrics

## Testing Checklist

- [ ] App starts without console errors
- [ ] Dashboard tab displays presence status
- [ ] Camera tab shows live preview
- [ ] Notifications tab displays app list
- [ ] Performance tab shows metrics
- [ ] Settings tab is accessible
- [ ] Tab switching works smoothly
- [ ] Real-time data updates visible

## Expected Behavior

The app now properly flows data from:
1. **App (root)** → Manages IPC and overall state
2. **Page (layout)** → Manages tab switching and local display state
3. **Components** → Receive data and emit events back up the tree

All component props are now properly typed and passed, fixing the preview display issue.
