# System Architecture

## Overview

Eisenhower Task Manager is a Tauri v2 desktop application with a layered architecture separating UI, business logic, and system integration.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           UI Layer (HTML/CSS/JS)         │
│  • index.html - DOM structure           │
│  • styles.css - Visual styling          │
│  • main.js - User interaction handling  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        Business Logic Layer (JS)         │
│  • classifier.js - Task classification   │
│  • Goal matching & AI classification    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        Data Layer (localStorage)         │
│  • Tasks, Goals, Pomodoro state        │
│  • API key storage                      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      System Integration (Rust/Tauri)    │
│  • System tray (show/quit)             │
│  • Desktop notifications                │
│  • Autostart on login                   │
│  • Window management                    │
└─────────────────────────────────────────┘
```

## Component Diagram

```
                    ┌─────────────────┐
                    │   index.html    │
                    │   (DOM Tree)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
    │  .input-bar    │ │ .matrix │ │   .sidebar   │
    │  (task input)  │ │(4 quads)│ │ (pomodoro,   │
    │                │ │         │ │  goals,      │
    │                │ │         │ │  settings)   │
    └────────────────┘ └─────────┘ └──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
    │ Quadrant 1-4   │ │ task-   │ │  goal-card   │
    │ (task lists)   │ │ list li │ │  (progress)  │
    └────────────────┘ └─────────┘ └──────────────┘
```

## Data Flow

### Task Addition Flow

```
1. User Input
   └─► #task-input.value
           │
2. Event Trigger
   └─► keydown(Enter) → addTask(text)
           │
3. Goal Matching
   └─► matchGoals(text) → goalId?
           │
4. AI Classification (if key exists)
   └─► classifyWithAI(text, apiKey) → quadrant?
           │
5. Keyword Fallback
   └─► classifyTask(text) → quadrant (0-4)
           │
6. Manual Selection (if quadrant=0)
   └─► showQuadrantSelector() → quadrant
           │
7. Update State
   └─► tasks.push({ id, text, quadrant, goalId, done })
           │
8. Persist & Render
   └─► save() → localStorage
   └─► render() → DOM update
   └─► renderGoals() → sidebar update
```

### Pomodoro Timer Flow

```
User clicks "Bắt đầu"
        │
        ▼
startPomodoro()
        │
        ├─► pomodoroState.isRunning = true
        ├─► pomodoroState.intervalId = setInterval(tickPomodoro, 1000)
        └─► updatePomodoroButtons()
        │
        ▼
Every second: tickPomodoro()
        │
        ├─► pomodoroState.remaining--
        ├─► updatePomodoroDisplay()
        └─► savePomodoroState()
        │
        ▼
remaining === 0
        │
        ▼
onPomodoroComplete()
        │
        ├─► pomodoroState.isRunning = false
        ├─► clearInterval(intervalId)
        ├─► playAlarm() → 3 beeps (Web Audio API)
        ├─► sendNotification() → Tauri plugin
        └─► updatePomodoroButtons()
```

## Module Responsibilities

### main.js

| Responsibility | Functions |
|----------------|-----------|
| State management | `tasks`, `goals`, `selectedTaskId`, `pomodoroState` |
| Task CRUD | `addTask()`, `editTask()`, `deleteTask()`, `toggleTaskDone()` |
| Rendering | `render()`, `renderGoals()`, `buildTaskEl()` |
| Quadrant management | `moveToQuadrant()`, `selectTask()` |
| Pomodoro timer | `startPomodoro()`, `pausePomodoro()`, `resetPomodoro()`, `tickPomodoro()` |
| Persistence | `save()`, `savePomodoroState()` |
| UI setup | `setupQuadrantClicks()`, `setupGoalsUI()`, `setupPomodoroUI()` |

### classifier.js

| Responsibility | Functions |
|----------------|-----------|
| Keyword classification | `classifyTask()` |
| AI classification | `classifyWithAI()` |
| Goal matching | `matchGoals()` |
| Goal persistence | `getGoals()`, `saveGoals()` |

### lib.rs

| Responsibility | Implementation |
|----------------|----------------|
| App initialization | `run()` function |
| System tray | `TrayIconBuilder` with menu |
| Tray events | `on_menu_event`, `on_tray_icon_event` |
| Plugin setup | `.plugin()` calls for autostart, notification |
| Window management | `window.show()`, `window.set_focus()` |

## Storage Architecture

```
localStorage
    │
    ├── 'eisenhower-tasks'    ──► Task[]
    ├── 'eisenhower-goals'    ──► Goal[]
    ├── 'eisenhower-pomodoro' ──► PomodoroState
    └── 'eisenhower-ai-key'  ──► string
```

## System Integration Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Tauri Application                  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │              WebView (HTML/CSS/JS)           │   │
│  │  ┌─────────────┐  ┌─────────────┐            │   │
│  │  │  main.js   │  │classifier.js│            │   │
│  │  └──────┬─────┘  └──────┬──────┘            │   │
│  │         │               │                    │   │
│  │         └───────┬───────┘                    │   │
│  │                 │                            │   │
│  │    ┌────────────▼────────────┐              │   │
│  │    │   Tauri IPC Bridge     │              │   │
│  │    │  (invoke / events)     │              │   │
│  │    └────────────┬────────────┘              │   │
│  └─────────────────┼──────────────────────────┘   │
│                     │                              │
│  ┌─────────────────▼──────────────────────────┐  │
│  │              Rust Backend (lib.rs)            │  │
│  │  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │  Plugins   │  │   System Tray       │   │  │
│  │  │• autostart │  │• show/quit menu     │   │  │
│  │  │• notifier  │  │• left-click show    │   │  │
│  │  └─────────────┘  └─────────────────────┘   │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │   OS Integration    │
          │• System tray icon  │
          │• Desktop notifs    │
          │• Login autostart   │
          └────────────────────┘
```

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| > 800px | Side-by-side: matrix + sidebar |
| <= 800px | Stacked: matrix above, sidebar below (flex-wrap) |
| <= 500px | Single column, full-width inputs |

## Key Design Decisions

1. **Vanilla JS** - No framework dependencies, faster load, simpler codebase
2. **localStorage** - Simple persistence without database, works offline
3. **Keyword-first AI-fallback** - Works without API key, AI improves accuracy
4. **Rust plugins** - Leverages Tauri ecosystem for system integration
5. **Web Audio API** - Cross-platform audio without native dependencies
