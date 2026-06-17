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

## Open Questions (Pending User Input)

1. **Auth requirement?** Individual accounts per user, or shared device sync?
2. **Offline priority?** Full offline needed, or internet required?
3. **Play Store?** Publish to Play Store, or PWA installable is enough?
4. **Extension scope?** Full features, or "quick add task" popup only?
5. **Data size?** Tasks/goals per user? (Affects pricing)

---

## Export Format (for Option 3 fallback)

```json
{
  "version": 1,
  "tasks": [...],
  "goals": [...],
  "pomodoro": {...},
  "exportedAt": "ISO timestamp"
}
```
