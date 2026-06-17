# Eisenhower Task - Cross-Platform Expansion Plan

## Context

User wants to expand Eisenhower Task app to:
1. Android mobile
2. Browser extension (same features as desktop)

Current app:
- Tauri v2 (Rust + web frontend)
- localStorage for data persistence
- Windows desktop only

---

## Options Analysis

### Option 1: PWA + Tauri Mobile (✅ Recommended)

| Aspect | Detail |
|--------|--------|
| Complexity | Medium |
| Cost | Low (Firebase free tier) |
| Maintainability | High - single codebase |

**Approach:**
- Convert frontend to PWA (Progressive Web App)
- Use IndexedDB (Dexie.js) instead of localStorage
- Add Firebase Firestore for real-time sync
- Generate Android APK via Tauri mobile

**Pros:**
- One codebase for all platforms
- Offline-first with background sync
- PWA installable on mobile without Play Store
- Firebase handles auth, storage, sync

**Cons:**
- Requires localStorage → IndexedDB refactor
- PWA has iOS background sync limitations

**Architecture:**
```
IndexedDB (local) ←→ Firebase Firestore (cloud) ←→ All devices
```

---

### Option 2: Tauri Mobile + Supabase + Browser Extension

| Aspect | Detail |
|--------|--------|
| Complexity | High |
| Cost | Medium (Supabase free tier) |
| Maintainability | Medium - 3 separate targets |

**Approach:**
- Tauri for desktop + Android
- Supabase for data sync
- Separate extension codebase using Supabase

**Pros:**
- Uses existing Rust skills
- Supabase open-source, self-hostable

**Cons:**
- Browser extension cannot share Tauri backend (sandbox restriction)
- Triple the maintenance surface

---

### Option 3: Extension First, Mobile Later (Manual Sync)

| Aspect | Detail |
|--------|--------|
| Complexity | Low initially |
| Cost | Zero |
| UX | Poor - manual export/import |

**Approach:**
- Ship browser extension MVP
- Manual JSON export/import for sync
- Add Firebase later

**Cons:**
- Manual sync is friction - users abandon within days

---

## Recommended Implementation Order

### Phase 1: Data Layer Refactor
- Replace localStorage with IndexedDB (Dexie.js)
- Migrate existing localStorage data
- Duration: ~1 day

### Phase 2: Firebase Sync
- Add Firebase SDK
- Implement Firestore real-time sync
- Handle offline/online states
- Duration: ~2 days

### Phase 3: PWA
- Create manifest.json
- Add service worker
- Configure installable PWA
- Duration: ~1 day

### Phase 4: Android APK
- Add Tauri mobile target
- Generate APK via `npm run tauri android`
- Duration: ~1 day

**Total: ~5 days**

---

## User Requirements (Finalized)

| Question | Answer |
|----------|--------|
| Auth | ❌ No auth needed |
| Sync | ✅ Online sync giữa 4 thiết bị: Mac, Windows, Android, Chrome Extension |
| Play Store | ❌ Không cần - chỉ cần cài APK trực tiếp |
| Extension | ✅ Full features (đầy đủ như desktop) |
| Users | 👤 1 user duy nhất (cá nhân) |

**Firebase free tier: Đủ dùng cho 1 user với lượng task thông thường.**

---

## Implementation Phases

### [Phase 1: Data Layer Refactor](./phase-01-data-layer.md)
- Replace localStorage with IndexedDB (Dexie.js)
- Keep existing API compatible
- Duration: ~1 day

### [Phase 2: Firebase Sync](./phase-02-firebase-sync.md)
- Simple device-based sync (no auth needed)
- Firestore real-time sync across all devices
- Handle offline/online states
- Duration: ~2 days

### [Phase 3: PWA + Chrome Extension](./phase-03-pwa-and-chrome-extension.md)
- PWA manifest + service worker
- Chrome Extension (Manifest V3) with full features
- Share sync layer with PWA
- Duration: ~2 days

### [Phase 4: Android APK](./phase-04-android-apk.md)
- Tauri mobile for Android
- Generate APK via `npm run tauri android`
- Use same synced data layer
- Duration: ~1 day

**Total: ~6 days**

---

## Phase Files

| Phase | File | Status |
|-------|------|--------|
| 1. Data Layer | `phase-01-data-layer.md` | ✅ Created |
| 2. Firebase Sync | `phase-02-firebase-sync.md` | ✅ Created |
| 3. PWA + Extension | `phase-03-pwa-and-chrome-extension.md` | ✅ Created |
| 4. Android APK | `phase-04-android-apk.md` | ✅ Created |

---

## Architecture

```
┌─────────┐     ┌─────────┐
│   Mac   │────▶│         │
└─────────┘     │         │
┌─────────┐     │         │
│ Windows │────▶│Firebase │
└─────────┘     │Firestore│
┌─────────┐     │         │
│ Android │◀────│         │
└─────────┘     │         │
┌─────────┐     │         │
│ Chrome  │────▶│         │
│Extension│     └─────────┘
└─────────┘
```

**No auth** → Use single Firebase project, devices sync via same Firestore collection.

---

## Export Format (for backup)

```json
{
  "version": 1,
  "tasks": [...],
  "goals": [...],
  "pomodoro": {...},
  "exportedAt": "ISO timestamp"
}
```
