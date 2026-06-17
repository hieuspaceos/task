# Code Standards

## Overview

Eisenhower Task Manager follows these coding standards. All code should be clean, readable, and maintainable.

## File Naming

- **JavaScript:** kebab-case or standard camelCase per module pattern
- **Rust:** snake_case for files and functions
- **CSS:** lowercase with hyphens (styles.css)

## JavaScript Standards

### Style Guidelines

- Use ES Modules (`import`/`export`)
- Use `const` for immutable bindings, `let` for mutable
- No semicolons at end of statements ( ASI compatible)
- 2-space indentation
- Max line length: ~100 characters

### Function Patterns

```javascript
// State management
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// DOM references cached at init
const input = document.getElementById('task-input');

// Event handlers use arrow functions
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask(input.value);
});

// Async functions for API calls
async function classifyWithAI(text, apiKey) {
  try {
    const response = await fetch('https://api.minimax.chat/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'MiniMax-Text-01', max_tokens: 10, messages: [...] })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim();
  } catch (e) {
    console.error('AI classification failed:', e);
    return null;
  }
}
```

### State Management

- All state stored in localStorage for persistence
- State accessed via module-level variables
- State mutations trigger `render()` calls
- Use `save()` function to persist state

### Error Handling

```javascript
// Try-catch for async operations
try {
  const result = await someAsyncOperation();
  return result;
} catch (e) {
  console.error('Operation failed:', e);
  return fallbackValue;
}

// Confirmation for destructive actions
if (!confirm('Xóa mục tiêu và tất cả task liên kết?')) return;
```

## CSS Standards

### Structure

```css
/* Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Component blocks separated by blank lines */
.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

/* State variants */
.task-list li.done {
  opacity: 0.6;
}

/* Responsive */
@media (max-width: 800px) {
  .main-layout { flex-direction: column; }
}
```

### Naming

- BEM-like naming: `.task-list`, `.task-btn`, `.task-text`
- State classes: `.done`, `.selected`, `.hover`
- Quadrant-specific: `.q1-btn`, `.q2-btn`

## Rust Standards

### Structure

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // System tray setup
            let show_item = MenuItem::with_id(app, "show", "Hiện", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Thoát", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| { /* ... */ })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Logging

- Use `log::info!`, `log::error!` macros
- Initialize `env_logger` at app start

## Data Models

### Task Object

```javascript
{
  id: string,          // Date.now().toString() - unique identifier
  text: string,        // Task content (trimmed on input)
  quadrant: 1|2|3|4,  // Eisenhower quadrant number
  goalId: string|null,// Reference to goal, null if none
  done: boolean       // Completion status
}
```

### Goal Object

```javascript
{
  id: string,          // Date.now().toString() - unique identifier
  text: string,        // Goal description
  color: string        // Hex color from GOAL_COLORS array
}
```

### PomodoroState Object

```javascript
{
  duration: number,    // Configured duration in minutes
  remaining: number,   // Remaining seconds
  isRunning: boolean, // Timer running state
  intervalId: number|null // setInterval ID for cleanup
}
```

## Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `eisenhower-tasks` | Task[] | All tasks |
| `eisenhower-goals` | Goal[] | All goals |
| `eisenhower-pomodoro` | PomodoroState | Timer state |
| `eisenhower-ai-key` | string | MiniMax API key |

## Quality Checklist

- [ ] No syntax errors - code compiles/runs
- [ ] All event handlers properly bound
- [ ] localStorage serialization handles empty state
- [ ] Error handling for API calls
- [ ] Confirmation dialogs for destructive actions
- [ ] Timer cleanup on pause/reset
- [ ] Responsive breakpoints tested
