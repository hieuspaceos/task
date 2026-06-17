# Phase 1: Data Layer Refactor

## Overview

| Item | Detail |
|------|--------|
| **Priority** | High (blocking Phase 2) |
| **Current Status** | Using localStorage |
| **Target** | Replace with IndexedDB via Dexie.js |
| **Duration** | ~1 day |

## Context Links

- Plan: `plan.md`
- Current data layer: `src/main.js` (lines 15-44)
- Classifier: `src/classifier.js`

## Current Data Model

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `eisenhower-tasks` | JSON Array | Tasks array |
| `eisenhower-goals` | JSON Array | Goals array |
| `eisenhower-pomodoro` | JSON Object | Pomodoro timer state |
| `eisenhower-notifications` | JSON Array | Notification history |
| `eisenhower-ai-key` | String | AI API key (optional) |

### Task Object Structure

```js
{
  id: string,          // Date.now().toString()
  text: string,        // Task content
  quadrant: 1-4,       // Q1-Q4
  goalId: string|null, // Optional goal link
  done: boolean,        // Completion status
  description: string|null  // NEW: description field
}
```

### Goal Object Structure

```js
{
  id: string,
  text: string,
  color: string  // Hex color
}
```

## Requirements Analysis

### Why IndexedDB?

| localStorage | IndexedDB (Dexie.js) |
|--------------|---------------------|
| ~5MB limit | ~50MB+ limit |
| Strings only | Objects, blobs |
| Blocking sync | Async, non-blocking |
| No querying | Index queries |
| Not shareable across origins | Shareable via Firebase |

### Why Dexie.js?

- Simpler API than raw IndexedDB
- Supports async/await
- Migration support
- Works in: browser, PWA, extension, Tauri WebView

## Technical Decisions

### Library Choice: Dexie.js

```json
{
  "dexie": "^4.0.0"
}
```

**Alternative considered:** raw IndexedDB (rejected - too complex)

### Database Schema

```js
const db = new Dexie('EisenhowerDB');

db.version(1).stores({
  tasks: 'id, quadrant, goalId, done',
  goals: 'id',
  pomodoro: 'id',  // single record
  notifications: 'id, timestamp, read'
});
```

### Migration Strategy

1. On app start, check if IndexedDB has data
2. If empty, migrate from localStorage
3. Mark localStorage migration flag
4. Future: deprecate localStorage

## Setup/Dependencies

```bash
npm install dexie@^4.0.0
```

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `dexie` dependency |
| `src/main.js` | Replace localStorage with Dexie.js calls |
| `src/classifier.js` | Check getGoals/saveGoals implementation |

## Files to Create

| File | Purpose |
|------|---------|
| `src/db.js` | Dexie database setup and helpers |

## Implementation Steps

### Step 1: Install Dexie.js

```bash
npm install dexie@^4.0.0
```

### Step 2: Create `src/db.js`

```js
import Dexie from 'dexie';

export const db = new Dexie('EisenhowerDB');

db.version(1).stores({
  tasks: 'id, quadrant, goalId, done',
  goals: 'id',
  pomodoro: 'id',
  notifications: 'id, timestamp, read'
});

// Migration from localStorage (one-time)
export async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem('eisenhower-migrated');
  if (migrated) return;

  // Tasks
  const tasks = JSON.parse(localStorage.getItem('eisenhower-tasks') || '[]');
  if (tasks.length) await db.tasks.bulkPut(tasks);

  // Goals
  const goals = JSON.parse(localStorage.getItem('eisenhower-goals') || '[]');
  if (goals.length) await db.goals.bulkPut(goals);

  // Pomodoro
  const pomodoro = JSON.parse(localStorage.getItem('eisenhower-pomodoro') || '{}');
  if (Object.keys(pomodoro).length) await db.pomodoro.put({ id: 'state', ...pomodoro });

  // Notifications
  const notifications = JSON.parse(localStorage.getItem('eisenhower-notifications') || '[]');
  if (notifications.length) await db.notifications.bulkPut(notifications);

  localStorage.setItem('eisenhower-migrated', 'true');
}

// Helper functions
export async function getTasks() {
  return db.tasks.toArray();
}

export async function saveTasks(tasks) {
  await db.tasks.clear();
  await db.tasks.bulkPut(tasks);
}

export async function getGoals() {
  return db.goals.toArray();
}

export async function saveGoals(goals) {
  await db.goals.clear();
  await db.goals.bulkPut(goals);
}

export async function getPomodoro() {
  return db.pomodoro.get('state');
}

export async function savePomodoro(state) {
  await db.pomodoro.put({ id: 'state', ...state });
}
```

### Step 3: Update `src/main.js`

Replace all `localStorage.getItem/setItem` with `db` calls.

**Lines to change:**
- Line 25: `let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');`
- Line 30: `let aiApiKey = localStorage.getItem(AI_API_KEY_STORAGE) || '';`
- Line 34-39: Pomodoro state initialization
- Line 43: Notifications initialization
- Lines 435-437: `save()` function
- And all other localStorage references

### Step 4: Check `src/classifier.js`

Verify `getGoals()` and `saveGoals()` functions - may need update to use `db.js`.

## Success Criteria

- [ ] Dexie.js installed via npm
- [ ] `src/db.js` created with all helper functions
- [ ] `migrateFromLocalStorage()` works (one-time)
- [ ] All localStorage calls replaced with db calls
- [ ] App still works locally (no network)
- [ ] No console errors

## Pre-flight Checklist

Before starting implementation, verify:

- [ ] `npm install` works in project root
- [ ] Current app builds and runs with `npm run tauri dev`
- [ ] localStorage data exists (for migration test)
- [ ] No TypeScript compilation needed (vanilla JS project)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Backup localStorage before, test migration in dev |
| Dexie API differences | Medium | Read Dexie docs, use simple API first |
| Tauri WebView compatibility | Low | Dexie works in all modern browsers |

## Next Phase

Phase 2: Firebase Sync - Requires Phase 1 complete.
