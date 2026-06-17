---
phase: 2
title: "Implement-UI"
status: pending
effort: "2h"
---

# Phase 2: Implement-UI

## Overview

Build the 4-quadrant Eisenhower grid with single task input.

## Requirements

- Single input field at top (full width)
- Enter key submits task
- 4 quadrants in 2x2 grid
- Tasks displayed as draggable cards
- Drag-and-drop between quadrants to reclassify
- Daily reset button

## UI Layout

```
┌────────────────────────────────────────────────────┐
│  [ Nhập task... ]                              [↻] │
├────────────────────────┬───────────────────────────┤
│  Q1: LÀM NGAY         │  Q2: LÊN LỊCH             │
│  ─────────────────    │  ─────────────────        │
│  • Task 1              │  • Task 3                  │
│  • Task 2              │                           │
├────────────────────────┼───────────────────────────┤
│  Q3: ỦY THÁC          │  Q4: LOẠI BỎ              │
│  ─────────────────    │  ─────────────────        │
│                        │  • Task 4                  │
└────────────────────────┴───────────────────────────┘
```

## Implementation Steps

1. **HTML structure**
   - Input form at top
   - 4 quadrant divs with headers
   - Reset button

2. **CSS**
   - Grid layout (2x2)
   - Card styling (task items)
   - Drag-over highlight
   - Responsive: stack vertically on mobile

3. **JS - basic structure**
   - Task array: `{ id, text, quadrant }`
   - Render function
   - Add task handler
   - Drag-and-drop handlers

## Related Code Files

- Create: `src/main.js` (core logic)
- Create: `src/style.css` (styling)
- Modify: `src/index.html` (structure)

## Success Criteria

- [ ] Input field accepts text and Enter submits
- [ ] 4 quadrants displayed correctly
- [ ] Tasks appear in correct quadrants after classifier
- [ ] Drag-and-drop moves tasks between quadrants
- [ ] Reset button clears all tasks