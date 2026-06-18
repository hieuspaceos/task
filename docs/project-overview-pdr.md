# Eisenhower Task Manager - Project Overview & PDR
*Updated: 2026-06-18*

## 1. Project Overview

**Name:** Eisenhower Task Manager
**Type:** Cross-platform Application (Tauri v2 + PWA)
**Version:** 0.1.0
**Summary:** A task management app based on the Eisenhower Matrix (4 quadrants), with AI-powered task classification, goals tracking, Firebase sync, and Pomodoro timer. Supports both desktop and mobile via responsive design.

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML, CSS, JavaScript (ES Modules) |
| Backend | Rust (Tauri v2) |
| Database | IndexedDB (local) + Firebase Firestore (cloud sync) |
| Plugins | tauri-plugin-notification, tauri-plugin-autostart |
| AI API | MiniMax Chat API (OpenAI-compatible) |
| PWA | Vite PWA plugin for mobile deployment |

## 3. Project Structure

```
task/
├── src/                          # Frontend source
│   ├── main.js                   # Main app logic (~1030 lines)
│   ├── index.html                # App entry point
│   ├── styles.css                # All styles (~1280 lines)
│   ├── classifier.js             # Task classification logic (147 lines)
│   ├── firebase.js               # Firebase sync with cache-first (202 lines)
│   ├── db.js                     # IndexedDB persistence layer
│   └── firebase-config.js        # Firebase configuration
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Tauri setup with system tray
│   │   └── main.rs               # Entry point
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/default.json
├── package.json
└── README.md
```

## 4. Product Development Requirements (PDR)

### 4.1 Core Features

#### F1: Eisenhower Matrix (4 Quadrants)
- **Q1** (Red): Urgent + Important - "Làm ngay" (Do immediately)
- **Q2** (Blue): Not Urgent + Important - "Lên lịch" (Schedule)
- **Q3** (Yellow): Urgent + Not Important - "Ủy thác" (Delegate)
- **Q4** (Gray): Not Urgent + Not Important - "Loại bỏ" (Eliminate)

#### F2: Task Classification
- Keyword-based classification (Vietnamese + English keywords)
- AI classification via MiniMax API (MiniMax-Text-01 model)
- Manual quadrant selection when classification fails (returns 0)

#### F3: Goals System
- Create goals with random colors (12 preset colors)
- Link tasks to goals
- Track goal progress (done/total tasks, percentage)
- Collapsible task lists in goals sidebar

#### F4: Pomodoro Timer
- Configurable duration (1-120 minutes, default 25)
- Visual progress bar
- Audio alarm (3 beeps via Web Audio API)
- Desktop notifications via Tauri plugin
- State persistence in localStorage + Firebase sync
- **Mobile:** Floating FAB button + fullscreen popup
- **Desktop:** Sidebar widget

#### F5: System Integration
- System tray with show/quit menu
- Left-click tray to show window
- Autostart on login (macOS launcher)
- Minimize to tray

### 4.2 Data Models

#### Task
```javascript
{
  id: string,          // Date.now().toString()
  text: string,        // Task content
  quadrant: 1|2|3|4,  // Eisenhower quadrant
  goalId: string|null,// Linked goal ID
  done: boolean       // Completion status
}
```

#### Goal
```javascript
{
  id: string,          // Date.now().toString()
  text: string,        // Goal description
  color: string        // Hex color (e.g., '#6366f1')
}
```

#### PomodoroState
```javascript
{
  duration: number,    // Minutes
  remaining: number,   // Seconds
  isRunning: boolean,
  intervalId: number|null
}
```

### 4.3 Storage Keys

| Key | Content |
|-----|---------|
| `eisenhower-tasks` | Task[] |
| `eisenhower-goals` | Goal[] |
| `eisenhower-pomodoro` | PomodoroState |
| `eisenhower-ai-key` | string (API key) |

### 4.4 Firebase Sync Architecture

- **Cache-first:** All reads go to localStorage cache first (instant, no Firestore cost)
- **Dual sync modes:**
  - Desktop: `enableSync()` uses real-time `onSnapshot` listeners
  - Mobile: `syncOnce()` uses one-time `getDoc()` fetch (battery optimization)
- **Offline-safe:** All `push*()` functions update cache first, then Firestore
- **Mobile detection:** `isMobile()` via `navigator.userAgent` regex

### 4.5 Non-Functional Requirements

- **Responsive:** Mobile-first design with touch-optimized UI at `hover: none and (pointer: coarse)` breakpoint
- **Persistent:** IndexedDB primary + Firebase cloud sync + localStorage cache
- **Offline:** Core features work without AI API key
- **Cross-platform:** Tauri v2 supports Windows, macOS, Linux
- **Mobile-ready:** PWA deployment via Vite PWA plugin

## 5. UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [Task Input............................] [↻ Reset]     │
├───────────────────────────────────┬─────────────────────┤
│  ┌─────────────┐ ┌─────────────┐  │  Pomodoro          │
│  │ Q1 LÀM NGAY │ │ Q2 LÊN LỊCH │  │  [25:00]           │
│  │ • task 1    │ │ • task 2    │  │  [▶] [↺]          │
│  │ • task 2    │ │             │  │  Duration: [25]   │
│  └─────────────┘ └─────────────┘  ├─────────────────────┤
│  ┌─────────────┐ ┌─────────────┐  │  Mục tiêu          │
│  │ Q3 ỦY THÁC  │ │ Q4 LOẠI BỎ │  │  [+ Add goal]      │
│  │ • task 3    │ │ • task 4    │  │  ┌─────────────┐   │
│  └─────────────┘ └─────────────┘  │  │ Goal 1     │   │
│                                    │  │ ████░░ 60% │   │
│                                    │  └─────────────┘   │
│                                    ├─────────────────────┤
│                                    │  Cài đặt           │
│                                    │  [🔑 API Key]      │
└────────────────────────────────────┴────────────────────┘
```

## 6. Dependencies

### npm
- `@tauri-apps/api`: ^2.11.0
- `@tauri-apps/plugin-notification`: ^2.3.3
- `@tauri-apps/cli`: ^2 (dev)

### Rust (Cargo.toml)
- `tauri`: 2 (with tray-icon feature)
- `tauri-plugin-opener`: 2
- `tauri-plugin-autostart`: 2
- `tauri-plugin-notification`: 2
- `serde`, `serde_json`: 1
- `log`, `env_logger`: 0.4 / 0.11

## 7. Acceptance Criteria

- [ ] Tasks can be added and automatically classified into quadrants
- [ ] Tasks can be manually moved between quadrants by clicking
- [ ] AI classification works when MiniMax API key is provided
- [ ] Goals can be created and linked to tasks
- [ ] Goal progress updates as tasks are completed
- [ ] Pomodoro timer counts down and sends notification on complete
- [ ] App minimizes to system tray
- [ ] App autostarts on system login
- [ ] All data persists across app restarts
