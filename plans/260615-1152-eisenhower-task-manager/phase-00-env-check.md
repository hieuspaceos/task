---
phase: 0
title: "Env-Check"
status: pending
effort: "15m"
---

# Phase 0: Env-Check

## Overview

Check prerequisites for Tauri development on current machine.

## Requirements

- Node.js ≥ 18
- npm ≥ 9
- Rust ≥ 1.70
- cargo (comes with Rust)
- Windows: Visual Studio Build Tools or clang (for Tauri)

## Implementation Steps

1. **Check Node.js**
   ```bash
   node --version
   npm --version
   ```

2. **Check Rust**
   ```bash
   rustc --version
   cargo --version
   ```

3. **If missing → install**

   | Component | Windows | Mac |
   |-----------|---------|-----|
   | Node.js | https://nodejs.org | brew install node |
   | Rust | https://rustup.rs | brew install rust |

4. **Verify Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli
   cargo tauri --version
   ```

## Success Criteria

- [ ] `node --version` ≥ 18
- [ ] `npm --version` ≥ 9
- [ ] `rustc --version` ≥ 1.70
- [ ] Tauri CLI available