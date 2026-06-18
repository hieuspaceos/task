# Project Roadmap
*Updated: 2026-06-18*

## Version 0.1.0 (Current)

**Status:** Initial Release

### Completed Features

- [x] Eisenhower Matrix (4 quadrants)
- [x] Task CRUD operations
- [x] Keyword-based classification (Vietnamese + English)
- [x] AI classification via MiniMax API
- [x] Goals system with progress tracking
- [x] Pomodoro timer with notifications
- [x] System tray integration
- [x] Autostart on login
- [x] Data persistence (IndexedDB + Firebase sync)
- [x] Firebase cloud sync (cache-first, dual sync modes)
- [x] Mobile UI with Pomodoro FAB + popup
- [x] Touch-optimized mobile controls (44px touch targets)

### Known Limitations

- No task editing during AI classification
- Pomodoro alarm uses Web Audio (may vary by browser)
- No Windows autostart configuration (macOS only)
- No task search/filter

---

## Version 0.2.0 (Planned)

### Task Management Enhancements

- [ ] Task search across all quadrants
- [ ] Task filter by goal
- [ ] Task filter by completion status
- [ ] Bulk task operations (delete multiple, move multiple)
- [ ] Task due date/deadline

### Goal System Enhancements

- [ ] Goal editing
- [ ] Goal categories/folders
- [ ] Goal deadline tracking
- [ ] Multiple goals per task

### Pomodoro Enhancements

- [ ] Configurable alarm sound
- [ ] Pomodoro history/statistics
- [ ] Break timer after pomodoro
- [ ] Long break after N pomodoros

---

## Version 0.3.0 (Planned)

### Data & Sync

- [ ] Export tasks to JSON/CSV
- [ ] Import tasks from JSON
- [ ] Cloud sync (optional account)
- [ ] Data backup/restore

### AI Enhancements

- [ ] Task priority scoring
- [ ] Smart deadline suggestions
- [ ] Recurring task detection
- [ ] Multiple AI provider support (OpenAI, Claude)

---

## Version 1.0.0 (Target)

### Platform Expansion

- [ ] Windows autostart support
- [ ] Linux autostart support
- [ ] Mobile companion app
- [ ] Keyboard shortcuts
- [ ] Global hotkey for quick task add

### Collaboration

- [ ] Share tasks/goals
- [ ] Task sharing via link
- [ ] Team workspace (future)

---

## Future Considerations

- [ ] Task templates
- [ ] recurring tasks
- [ ] Calendar integration
- [ ] Drag-and-drop reordering
- [ ] Theme customization (dark mode)
- [ ] Localization (more languages)
- [ ] Statistics dashboard
- [ ] Weekly/monthly reports

---

## Changelog

### v0.1.0 (Initial Release)

- First release with core Eisenhower Matrix functionality
- Task classification (keyword + AI)
- Goals system with progress tracking
- Pomodoro timer with desktop notifications
- System tray integration
- Autostart on macOS login

### v0.1.1 (2026-06-18) - Mobile Redesign + Firebase Optimization

**Mobile UI Redesign:**
- Pomodoro moved from sidebar to floating FAB button + fullscreen popup
- CSS media query `@media (hover: none) and (pointer: coarse)` for touch devices
- Pomodoro FAB: `display:flex`, `position:fixed bottom:20px right:20px`
- Pomodoro Popup: fullscreen overlay with `display:flex`/`visibility` toggle
- Goals add button: `touch-action: manipulation`, `min-width:44px`, `min-height:44px` for better touch
- Desktop Pomodoro restored in sidebar

**Firebase Sync Optimization:**
- LocalStorage cache-first: `readCache()`/`writeCache()` functions eliminate Firestore reads on cold load
- Two sync modes:
  - Desktop: `enableSync()` uses real-time `onSnapshot` listeners
  - Mobile: `syncOnce()` uses one-time `getDoc()` fetch (battery optimization)
- `isMobile()` detection via `navigator.userAgent` regex
- All `push*()` functions update cache first, then Firestore (offline-safe)

**Bug Fixes:**
- Duplicate exports in firebase.js fixed
- `resetBtn` null check added (element removed from mobile HTML)
