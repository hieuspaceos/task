# Codebase Summary
*Updated: 2026-06-18*

## Overview

Eisenhower Task Manager is a Tauri v2 cross-platform application using vanilla HTML/CSS/JS for the frontend and Rust for system integration. Features Firebase Firestore sync with cache-first architecture.

## File Inventory

### Frontend (src/)

| File | LOC | Purpose |
|------|-----|---------|
| `index.html` | 109 | App entry, DOM structure with 4 quadrants + sidebar + mobile Pomodoro FAB |
| `main.js` | ~1030 | Core app logic: tasks, goals, pomodoro, Firebase sync, event handlers |
| `styles.css` | ~1280 | All styling: matrix grid, sidebar, modals, mobile FAB, responsive |
| `classifier.js` | 147 | Task classification: keywords + AI (MiniMax) |
| `firebase.js` | 202 | Firebase sync with cache-first, dual sync modes (real-time vs one-time) |
| `db.js` | - | IndexedDB persistence layer (migrated from localStorage) |

### Backend (src-tauri/)

| File | LOC | Purpose |
|------|-----|---------|
| `lib.rs` | 64 | Tauri setup: system tray, autostart plugin, window management |
| `main.rs` | ~10 | Entry point, calls `run()` |
| `Cargo.toml` | 24 | Rust dependencies |
| `tauri.conf.json` | 39 | App config: window size, bundle settings |

## Key Implementation Details

### main.js Structure

```
State (lines 32-50)
├── tasks[]          - Task list from IndexedDB
├── goals[]          - Goals from IndexedDB
├── selectedTaskId   - For move-between-quadrants
├── selectedGoalId   - For goal filtering
├── pomodoroState    - Timer state
├── notifications[]  - In-app notification center
└── aiApiKey         - Stored in localStorage

Core Functions
├── buildTaskEl()       - Create task DOM element (line 75)
├── render()            - Re-render all task lists (line 168)
├── renderGoals()       - Render goals sidebar (line 185)
├── addTask()           - Add + classify task (line 286)
├── toggleTaskDone()    - Toggle completion (line 254)
├── moveToQuadrant()    - Move selected task (line 274)
├── editTask()          - Edit modal (line 372)
├── deleteTask()        - Delete task (line 461)
├── save()              - Persist to IndexedDB + Firebase (line 471)

Pomodoro Functions
├── startPomodoro()       - Start timer (line 689)
├── pausePomodoro()       - Pause timer (line 697)
├── resetPomodoro()       - Reset timer (line 706)
├── tickPomodoro()        - Timer tick (line 679)
├── playAlarm()           - 3 beeps via Web Audio API (line 595)
├── sendNotification()    - In-app + native notification (line 660)
└── onPomodoroComplete() - Handle completion (line 669)

Firebase Sync Functions
├── init()                - Main init with cache-first loading (line 944)
├── setupPomodoroUI()     - Mobile FAB + popup setup (line 885)
└── updatePomodoroDisplay() - Updates desktop + FAB + popup displays
```

### classifier.js Structure

```
Keyword Arrays
├── Q1_KEYWORDS (line 1) - 32 keywords (EN+VI)
├── Q2_KEYWORDS (line 11) - 48 keywords (EN+VI)
├── Q3_KEYWORDS (line 26) - 32 keywords (EN+VI)
└── Q4_KEYWORDS (line 38) - 40 keywords (EN+VI)

Functions
├── getGoals() / saveGoals() - localStorage access (line 53-59)
├── matchGoals() - Match task text to user goals (line 62)
├── classifyTask() - Keyword-based classification (line 79)
│   └── Returns 0 if no match (triggers manual selector)
└── classifyWithAI() - MiniMax API call (line 110)
    └── Uses OpenAI-compatible endpoint
```

### firebase.js Structure

```
Cache Functions
├── readCache(key)    - Read from localStorage cache (no Firestore cost)
└── writeCache(key, data) - Write to localStorage cache

Sync Functions
├── enableSync()        - Real-time listeners (Desktop) - line 57
├── disableSync()       - Cleanup listeners - line 100
├── fetchFromFirestore() - One-time fetch - line 108
├── syncOnce()          - One-time sync (Mobile) - line 124
└── isMobile()          - Detect mobile via userAgent - line 144

Push Functions (cache-first, offline-safe)
├── pushTasks()    - Update cache, then Firestore - line 149
├── pushGoals()    - Update cache, then Firestore - line 163
├── pushPomodoro() - Update cache, then Firestore - line 176
└── pushNotifications() - Update cache, then Firestore - line 189

Exports
└── isFirebaseConfigured, readCache, isMobile, enableSync, disableSync, syncOnce, fetchFromFirestore, push*
```

### lib.rs Structure

```
run() function (line 8)
├── env_logger init
├── Plugin registration:
│   ├── tauri_plugin_opener
│   ├── tauri_plugin_autostart (MacosLauncher::LaunchAgent)
│   └── tauri_plugin_notification
└── System tray setup (TrayIconBuilder)
    ├── Menu items: "Hiện", "Thoát"
    ├── on_menu_event: show/quit handlers
    └── on_tray_icon_event: left-click shows window
```

## Data Flow

```
User Input Task
      │
      ▼
addTask(text) [main.js:243]
      │
      ├─► AI Classification? ──► classifyWithAI() [classifier.js:110]
      │       │                      │
      │       │ YES                   │ NO
      │       ▼                      ▼
      │   quadrant found?      classifyTask() [classifier.js:79]
      │       │ YES                   │
      │       ▼                      ▼
      │   push to tasks[]        keyword match?
      │                              │ YES
      │                              ▼
      │                          quadrant 1-4
      │                              │
      │                         no match ──► showQuadrantSelector()
      │                              │
      └──────────────────────────────┘
                    │
                    ▼
            push to tasks[]
                    │
                    ▼
            render() + renderGoals()
                    │
                    ▼
            localStorage.setItem()
```

## Quadrant Classification Logic

```
classifyTask(text)
│
├─► matchGoals(text) → matched?
│       │ YES
│       │    ├─► Q1 keywords present? → return 1
│       │    └─► return 2 (important)
│       │
│       │ NO
│       ▼
├─► Q1_KEYWORDS match? → return 1 (urgent+important)
├─► Q2_KEYWORDS match? → return 2 (important)
├─► Q3_KEYWORDS match? → return 3 (urgent, delegatable)
├─► Q4_KEYWORDS match? → return 4 (not urgent, not important)
└─► no match → return 0 (manual selection required)
```

## LocalStorage Schema (Firebase Cache Keys)

```javascript
// Firebase cache keys (localStorage)
'eisenhower_tasks_cache'         // Task[] - cache-first read
'eisenhower_goals_cache'         // Goal[]
'eisenhower_pomodoro_cache'      // PomodoroState
'eisenhower_notifications_cache' // Notification[]

// Original localStorage keys (legacy/migration)
'eisenhower-tasks'
'eisenhower-goals'
'eisenhower-pomodoro'
'eisenhower-ai-key'
```

## Firebase Sync Flow

```
App Init (main.js:init)
    │
    ├─► readCache('tasks') ──► instant UI load (no Firestore cost)
    ├─► readCache('goals')
    ├─► readCache('pomodoro')
    └─► readCache('notifications')
    │
    ├─► isMobile()? ─► YES ─► syncOnce() ─► one-time getDoc() fetch
    │                                        (battery optimization)
    │
    └─► isMobile()? ─► NO ─► enableSync() ─► onSnapshot listeners
    │                                     (real-time sync)
```

## Mobile UI Pattern

- **Touch detection:** `@media (hover: none) and (pointer: coarse)`
- **Pomodoro FAB:** Fixed bottom-right, 60x60px circular button
- **Pomodoro Popup:** Fullscreen overlay with centered timer controls
- **Goals add button:** `min-width: 44px`, `min-height: 44px`, `touch-action: manipulation`

## Event Flow

### Task Addition
1. User types in `#task-input`, presses Enter
2. `addTask()` triggered (line 243)
3. Goal matching attempted
4. AI classification attempted if key exists
5. Fallback to keyword classification
6. If quadrant 0, show modal for manual selection
7. Task pushed to array, `render()` called

### Pomodoro Timer
1. User clicks "Bắt đầu"
2. `startPomodoro()` sets interval (line 601)
3. `tickPomodoro()` decrements every second (line 591)
4. Progress bar updates (line 522)
5. On complete: `onPomodoroComplete()` (line 581)
6. Audio alarm plays (3 beeps)
7. Desktop notification sent
