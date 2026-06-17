# Codebase Summary

## Overview

Eisenhower Task Manager is a Tauri v2 desktop application using vanilla HTML/CSS/JS for the frontend and Rust for system integration.

## File Inventory

### Frontend (src/)

| File | LOC | Purpose |
|------|-----|---------|
| `index.html` | 80 | App entry, DOM structure with 4 quadrants + sidebar |
| `main.js` | 678 | Core app logic: tasks, goals, pomodoro, event handlers |
| `styles.css` | 750 | All styling: matrix grid, sidebar, modals, responsive |
| `classifier.js` | 147 | Task classification: keywords + AI (MiniMax) |

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
State (lines 18-33)
├── tasks[]          - Task list from localStorage
├── goals[]          - Goals from localStorage
├── selectedTaskId   - For move-between-quadrants
├── selectedGoalId   - For goal filtering
├── aiApiKey         - Stored in localStorage
└── pomodoroState    - Timer state

Core Functions
├── buildTaskEl()    - Create task DOM element (line 59)
├── render()         - Re-render all task lists (line 126)
├── renderGoals()    - Render goals sidebar (line 143)
├── addTask()        - Add + classify task (line 243)
├── toggleTaskDone() - Toggle completion (line 211)
├── moveToQuadrant() - Move selected task (line 231)
├── editTask()       - Edit modal (line 332)
├── deleteTask()     - Delete task (line 415)
└── save()          - Persist to localStorage (line 424)

Pomodoro Functions
├── startPomodoro()   - Start timer (line 601)
├── pausePomodoro()   - Pause timer (line 609)
├── resetPomodoro()   - Reset timer (line 618)
├── tickPomodoro()    - Timer tick (line 591)
├── playAlarm()       - 3 beeps via Web Audio API (line 526)
├── sendNotification()- Tauri notification (line 559)
└── onPomodoroComplete() - Handle completion (line 581)
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

## LocalStorage Schema

```javascript
// Tasks: 'eisenhower-tasks'
[
  { id: "1712345678901", text: "Hoàn thành báo cáo", quadrant: 1, goalId: null, done: false },
  { id: "1712345678902", text: "Họp team", quadrant: 2, goalId: "1712345678001", done: true }
]

// Goals: 'eisenhower-goals'
[
  { id: "1712345678001", text: "Dự án A", color: "#6366f1" }
]

// Pomodoro: 'eisenhower-pomodoro'
{ duration: 25, remaining: 1500, isRunning: false, intervalId: null }

// AI Key: 'eisenhower-ai-key'
"eyJhbGciOiJ..."
```

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
