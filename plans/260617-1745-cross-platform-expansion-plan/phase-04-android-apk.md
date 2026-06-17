# Phase 4: Android APK

## Overview

| Item | Detail |
|------|--------|
| **Priority** | High |
| **Prerequisite** | Phase 1 & 2 complete |
| **Target** | Android APK via Tauri mobile |
| **Duration** | ~1 day |

## Context Links

- Phase 2: `phase-02-firebase-sync.md`
- Tauri Mobile: https://v2.tauri.app/distribute/mobile/
- Tauri Android Guide: https://v2.tauri.app/distribute/android/

## Requirements

- Generate Android APK (not publish to Play Store)
- Install APK directly on Android device
- Same app functionality as desktop
- Sync via Firebase (Phase 2)

## Technical Decisions

### Option: Tauri Mobile vs Capacitor

| Aspect | Tauri Mobile | Capacitor |
|--------|--------------|-----------|
| Ecosystem | Rust + web | Node + web |
| Bundle size | Smaller (~3MB) | Larger (~10MB) |
| Native features | Rust plugins | Plugin ecosystem |
| Firebase support | Works | Works |
| Learning curve | Higher (Rust) | Lower (JS) |

**Decision:** Tauri Mobile (leverages existing Tauri v2 setup)

### Why not Capacitor?

- Already using Tauri for desktop
- Tauri mobile uses same web frontend
- Smaller APK size
- Consistent tech stack

## Prerequisites

1. Install Android SDK
2. Install Java JDK 17+
3. Set environment variables
4. Tauri CLI mobile support

### Android SDK Setup

```bash
# Using Android SDK command line tools
# Download from: https://developer.android.com/studio#command-line-tools-only

export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses
yes | sdkmanager --licenses
```

### Java Setup

```bash
# Windows: Install OpenJDK 17+
# Download from: https://adoptium.net/

# Verify
java -version
```

## Tauri Mobile Setup

### Step 1: Check Tauri CLI

```bash
npm install -D @tauri-apps/cli
```

### Step 2: Add Android Target

```bash
npm run tauri init -- --app-name "Eisenhower Task" --window-title "Eisenhower Task" --dev-url http://localhost:1420 --before-dev-command "npm run dev" --before-build-command "npm run build" --ci
```

### Step 3: Configure Android

Edit `src-tauri/Cargo.toml`:

```toml
[target.'cfg(not(any(target_os = "android")))'.dependencies]
tauri = { version = "2", features = ["devtools"] }

[target.'cfg(target_os = "android")'.dependencies]
tauri = { version = "2", features = ["devtools"] }
```

### Step 4: Update tauri.conf.json

```json
{
  "productName": "Eisenhower Task",
  "version": "0.1.0",
  "identifier": "com.eisenhower.task",
  "build": {
    "frontendDist": "../src",
    "devtools": true
  },
  "app": {
    "windows": [...],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["android", "msi", "nsis"]
  }
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src-tauri/Cargo.toml` | Android target dependencies |
| `src-tauri/tauri.conf.json` | Bundle targets, mobile config |
| `src-tauri/src/main.rs` | Android-specific setup (if needed) |

## Build Commands

### Development Build (Debug APK)

```bash
npm run tauri android dev
```

### Production Build (Release APK)

```bash
npm run tauri android build
```

### Output Location

```
src-tauri/target/release/bundle/android/app-release.apk
```

## Testing on Android

### Install via ADB

```bash
adb install app-release.apk
```

### Install via USB

1. Enable USB debugging on Android device
2. Connect device to computer
3. Transfer APK to device
4. Open APK to install

### Install via QR Code

- Use `adb install` or
- Upload APK to cloud storage, scan QR code

## Success Criteria

- [ ] Android SDK installed and configured
- [ ] Tauri android target added
- [ ] Debug APK builds successfully
- [ ] APK installs on Android device
- [ ] App launches and works offline
- [ ] Firebase sync works on mobile
- [ ] All features work same as desktop

## Pre-flight Checklist

Before starting implementation, verify:

- [ ] Java JDK 17+ installed
- [ ] `java -version` works
- [ ] Android SDK downloaded
- [ ] `ANDROID_HOME` environment variable set
- [ ] Android SDK licenses accepted
- [ ] Physical Android device or emulator available

### Check Android SDK

```bash
# Should show SDK manager
echo $ANDROID_HOME
ls $ANDROID_HOME/cmdline-tools/latest/bin/

# Should show platform-tools
ls $ANDROID_HOME/platform-tools/
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Android SDK setup complex | Time delay | Follow official guide carefully |
| Tauri mobile bugs | Build fails | Check Tauri v2 mobile docs |
| Firebase not working on mobile | Sync broken | Test with simple Firebase call first |
| APK size too large | Storage issue | Enable R8 minification |

## Post-Build

After successful APK build:

1. **Backup APK** to cloud storage
2. **Share via** cloud link or USB
3. **Test on multiple devices** if possible

## Next Steps

After Phase 4 complete:

- All 4 platforms working
- Firebase sync across all devices
- User can install APK on Android
- User can install PWA on Mac/Windows
- User can add Chrome Extension

## Summary

| Platform | Method | Output |
|----------|--------|--------|
| Windows | Tauri | `.exe` installer |
| Mac | Tauri | `.app` bundle |
| Android | Tauri Mobile | `.apk` |
| Browser | PWA | Installable |
| Chrome | Extension | `.crx` |
