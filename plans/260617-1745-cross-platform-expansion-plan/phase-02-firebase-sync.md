# Phase 2: Firebase Sync

## Overview

| Item | Detail |
|------|--------|
| **Priority** | High (blocking Phase 3, 4) |
| **Prerequisite** | Phase 1 complete |
| **Target** | Real-time sync via Firebase Firestore |
| **Duration** | ~2 days |

## Context Links

- Phase 1: `phase-01-data-layer.md`
- Plan: `plan.md`
- Firebase Docs: https://firebase.google.com/docs/firestore

## Requirements

- No authentication (1 user, multiple devices)
- Real-time sync across: Mac, Windows, Android, Chrome Extension
- Offline support (read when offline, sync when online)
- Simple setup (no auth flow)

## Technical Decisions

### Why Firebase Firestore?

| Option | Pros | Cons |
|--------|------|------|
| Firebase Firestore | Real-time sync, free tier, easy setup | Google account needed |
| Supabase | Open source, self-hostable | More complex setup |
| PocketBase | Self-hosted, simple | No real-time on free tier |
| AWS Amplify | Full AWS ecosystem | Overkill for single user |

**Decision:** Firebase Firestore (simpler, well-documented, good free tier)

### Firebase Free Tier Limits

- 50K reads/day
- 20K writes/day
- 1GB storage
- **Enough for 1 user with typical task app usage**

### Data Architecture

```
Collection: 'user_data'
  Document: 'tasks' → { tasks: [...], updatedAt: timestamp }
  Document: 'goals' → { goals: [...], updatedAt: timestamp }
  Document: 'pomodoro' → { ...state }
  Document: 'notifications' → { notifications: [...] }
```

**Why single user?** No auth needed - all devices write to same document.

## Setup/Dependencies

```bash
npm install firebase@^11.0.0
```

### Firebase Console Steps

1. Go to https://console.firebase.google.com
2. Create project: "Eisenhower Task"
3. Enable Firestore Database (start in test mode)
4. Get config object:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/firebase.js` | Firebase initialization, sync logic |
| `.env.example` | Template for Firebase config (gitignored) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/db.js` | Add Firestore sync hooks |
| `src/main.js` | Initialize Firebase on load |
| `.gitignore` | Add `.env` to ignore |

## Implementation Steps

### Step 1: Create Firebase Config

Create `src/firebase-config.js`:

```js
// Firebase configuration - replace with your own from Firebase Console
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Important:** Add `.env` to `.gitignore` after creating.

### Step 2: Create `src/firebase.js`

```js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sync state
let syncEnabled = false;
let unsubscribers = [];

// Enable sync - call after user grants permission
export async function enableSync() {
  if (syncEnabled) return;
  syncEnabled = true;

  // Listen to tasks
  unsubscribers.push(
    onSnapshot(doc(db, 'user_data', 'tasks'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // Update local IndexedDB
        // This will trigger UI update
        window.dispatchEvent(new CustomEvent('tasks-sync', { detail: data.tasks }));
      }
    })
  );

  // Similar for goals, pomodoro, notifications
}

// Disable sync
export function disableSync() {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  syncEnabled = false;
}

// Push local changes to Firestore
export async function pushTasks(tasks) {
  await setDoc(doc(db, 'user_data', 'tasks'), {
    tasks,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function pushGoals(goals) {
  await setDoc(doc(db, 'user_data', 'goals'), {
    goals,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function pushPomodoro(state) {
  await setDoc(doc(db, 'user_data', 'pomodoro'), {
    ...state,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function pushNotifications(notifications) {
  await setDoc(doc(db, 'user_data', 'notifications'), {
    notifications,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
```

### Step 3: Update `src/db.js`

Integrate Firebase push into save functions:

```js
import { pushTasks, pushGoals, pushPomodoro, pushNotifications } from './firebase.js';

export async function saveTasks(tasks) {
  await db.tasks.clear();
  await db.tasks.bulkPut(tasks);
  // Sync to Firebase
  await pushTasks(tasks);
}
```

### Step 4: Handle Sync Events in `src/main.js`

```js
import { enableSync } from './firebase.js';
import { getTasks, getGoals } from './db.js';

// On app load
window.addEventListener('tasks-sync', async (e) => {
  const syncedTasks = e.detail;
  // Compare with local, merge if needed
  const localTasks = await getTasks();
  // Simple strategy: latest wins by updatedAt
  // Implementation depends on merge strategy
});

// Call enableSync() after migration
```

## Success Criteria

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] `src/firebase.js` created with sync logic
- [ ] Local changes push to Firestore
- [ ] Remote changes pull to local
- [ ] Works offline (changes queue)
- [ ] No console errors
- [ ] Sync between 2 browser tabs works

## Pre-flight Checklist

Before starting implementation, verify:

- [ ] Phase 1 complete (IndexedDB working)
- [ ] Google account for Firebase Console
- [ ] Can access Firebase Console
- [ ] npm install works

## Merge Strategy

### Scenario: Same task modified on 2 devices

**Options:**
1. Last-write-wins (by timestamp) - simple, may lose changes
2. Field-level merge - complex
3. Vector clock - very complex

**Recommended:** Last-write-wins with `updatedAt` field.

```js
function mergeTasks(local, remote) {
  if (!remote.updatedAt || remote.updatedAt <= local.updatedAt) {
    return local; // Keep local
  }
  return remote; // Remote is newer
}
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firebase config exposed | Security | Add to .gitignore, use environment variables |
| Sync conflicts | Data loss | Implement timestamp-based merge |
| Offline changes lost | Data loss | Firebase handles offline queue |
| Firebase quota exceeded | Service down | Monitor usage, warn user |

## Next Phase

Phase 3: PWA + Chrome Extension - Requires Phase 2 complete.
