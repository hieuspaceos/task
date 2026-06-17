---
phase: 1
title: "Setup"
status: in_progress
effort: "30m"
---

# Phase 1: Setup

## Overview

Scaffold Tauri 2.x project with vanilla HTML/CSS/JS frontend.

## Implementation Steps

1. **Create Tauri app**
   ```bash
   npm create tauri-app@latest eisenhower-task -- --template vanilla --manager npm --yes
   cd eisenhower-task
   ```
   - Template: vanilla (no React/Vue)
   - Manager: npm

2. **Update tauri.conf.json**
   - App name: "Eisenhower Task"
   - Enable devtools for debugging
   - Window: 800x600, centered, resizable

3. **Clean default template**
   - Remove boilerplate CSS/JS
   - Keep `index.html`, `main.js`, `style.css` structure

4. **Verify dev server runs**
   ```bash
   npm run tauri dev
   ```

## Success Criteria

- [ ] `npm run tauri dev` starts without errors
- [ ] Empty window appears (800x600)
- [ ] No console errors on load