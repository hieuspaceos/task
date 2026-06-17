# Eisenhower Task Manager - Project Overview & PDR

## 1. Project Overview

**Name:** Eisenhower Task Manager
**Type:** Desktop Application (Tauri v2)
**Version:** 0.1.0
**Summary:** A task management app based on the Eisenhower Matrix (4 quadrants), with AI-powered task classification, goals tracking, and Pomodoro timer.

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML, CSS, JavaScript (ES Modules) |
| Backend | Rust (Tauri v2) |
| Plugins | tauri-plugin-notification, tauri-plugin-autostart |
| AI API | MiniMax Chat API (OpenAI-compatible) |

## 3. Project Structure

```
task/
├── src/                          # Frontend source
│   ├── main.js                   # Main app logic (678 lines)
│   ├── index.html                # App entry point
│   ├── styles.css                # All styles (750 lines)
│   └── classifier.js             # Task classification logic (147 lines)
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
- State persistence in localStorage

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

### 4.4 Non-Functional Requirements

- **Responsive:** Adapts to mobile (single column) at 800px and 500px breakpoints
- **Persistent:** All data stored in localStorage
- **Offline:** Core features work without AI API key
- **Cross-platform:** Tauri v2 supports Windows, macOS, Linux

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
