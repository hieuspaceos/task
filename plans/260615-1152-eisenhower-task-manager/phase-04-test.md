---
phase: 4
title: "Test"
status: pending
effort: "1h"
---

# Phase 4: Test

## Overview

Manual testing of all features, build verification.

## Implementation Steps

1. **Manual test cases**
   - Add task with EN keywords → correct quadrant
   - Add task with VN keywords → correct quadrant
   - Add task with date → correct quadrant
   - Drag task to different quadrant → persists
   - Reset button → clears all
   - Refresh page → tasks persist (LocalStorage)

2. **Build for Windows**
   ```bash
   npm run tauri build
   ```

3. **Verify .exe runs**
   - Run built executable
   - Check no runtime errors

## Success Criteria

- [ ] All manual test cases pass
- [ ] `.exe` file generated
- [ ] App launches and works standalone