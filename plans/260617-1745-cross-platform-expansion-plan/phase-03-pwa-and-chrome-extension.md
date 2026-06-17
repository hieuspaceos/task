# Phase 3: PWA + Chrome Extension

## Overview

| Item | Detail |
|------|--------|
| **Priority** | High |
| **Prerequisite** | Phase 1 & 2 complete |
| **Target** | PWA installable + Chrome Extension with full features |
| **Duration** | ~2 days |

## Context Links

- Phase 2: `phase-02-firebase-sync.md`
- PWA Guide: https://web.dev/progressive-web-apps/
- Chrome Extension: https://developer.chrome.com/docs/extensions/mv3/

## Requirements

- PWA: Installable on Mac, Windows, Android
- Chrome Extension: Full features (same as desktop app)
- Both use same Firebase sync layer

## Part A: PWA (Progressive Web App)

### Setup/Dependencies

No additional npm packages needed - native browser APIs.

### Files to Create

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `public/icons/` | PWA icons (various sizes) |

### manifest.json

```json
{
  "name": "Eisenhower Task",
  "short_name": "Eisenhower",
  "description": "Eisenhower Matrix Task Manager",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (sw.js)

```js
const CACHE_NAME = 'eisenhower-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
  '/classifier.js',
  '/db.js',
  '/firebase.js'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Sync (background sync when online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});
```

### Update tauri.conf.json

```json
{
  "build": {
    "frontendDist": "../src",
    "devUrl": "http://localhost:1420"
  }
}
```

## Part B: Chrome Extension (Manifest V3)

### Structure

```
extension/
├── manifest.json
├── popup.html      # Mini UI when clicking extension
├── popup.js        # Popup logic
├── background.js   # Service worker for background tasks
├── content.js      # Content script (if needed)
└── icons/          # Extension icons
```

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Eisenhower Task",
  "version": "1.0",
  "description": "Eisenhower Matrix Task Manager",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "permissions": [
    "storage",
    "notifications"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

### Popup HTML (popup.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Eisenhower Task</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <h1>Eisenhower Task</h1>
    <input type="text" id="task-input" placeholder="Add task...">
    <div id="quadrants">
      <div class="quadrant" data-q="1">Q1</div>
      <div class="quadrant" data-q="2">Q2</div>
      <div class="quadrant" data-q="3">Q3</div>
      <div class="quadrant" data-q="4">Q4</div>
    </div>
    <div id="tasks"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

### Extension Constraints

**Cannot do:**
- Access Firebase Firestore directly from extension popup (CORS)
- Use same `localStorage` as main app

**Solution:**
- Extension uses `chrome.storage.local` for its own data
- Sync via Firebase REST API or message passing
- Or: Extension opens full app in new tab

### Alternative: Full App Extension

Instead of mini popup, open full app in new tab:

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_icon": {...}
  },
  "permissions": ["tabs"],
  "background": {
    "service_worker": "background.js"
  }
}
```

```js
// background.js
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "index.html" });
});
```

**Recommended approach:** Mini popup for quick add, link to full app.

## Files to Create

### PWA

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |

### Chrome Extension

| File | Purpose |
|------|---------|
| `extension/manifest.json` | Extension manifest |
| `extension/popup.html` | Mini UI |
| `extension/popup.js` | Popup logic |
| `extension/popup.css` | Popup styles |
| `extension/background.js` | Background worker |
| `extension/icons/` | Extension icons |

## Success Criteria

### PWA
- [ ] `manifest.json` created
- [ ] `sw.js` service worker created
- [ ] App installable as PWA on desktop
- [ ] App installable on Android Chrome
- [ ] Offline mode works

### Chrome Extension
- [ ] Extension loads in Chrome
- [ ] Popup shows mini UI
- [ ] Can add tasks from popup
- [ ] Tasks sync via Firebase
- [ ] Can open full app from extension

## Pre-flight Checklist

Before starting implementation, verify:

- [ ] Phase 2 complete (Firebase working)
- [ ] App builds without errors
- [ ] Chrome browser available for testing
- [ ] Can load unpacked extension in Chrome

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PWA not installable on iOS | iOS users | Inform user, iOS PWA support limited |
| Extension popup CORS | Extension can't use same Firebase | Use REST API or chrome.storage |
| Service worker cache invalidation | Old app shown | Version cache name on update |

## Next Phase

Phase 4: Android APK - Requires Phase 1 & 2 complete.
