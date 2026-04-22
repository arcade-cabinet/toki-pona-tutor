---
title: Mobile QA
updated: 2026-04-22
status: current
domain: quality
---

# Mobile QA

Maestro covers native/emulator smoke paths that Playwright cannot prove. These
flows are not a replacement for the Playwright browser suite; they are the
device-facing release smoke layer for touch, WebView boot, orientation, and
deployed Pages behavior.

## Scope

-   Android debug APK smoke runs against the Capacitor app ID
    `com.pokisoweli.game`.
-   iOS smoke runs against Mobile Safari and the deployed GitHub Pages URL until
    a Capacitor iOS platform exists.
-   Signed release APK testing is still deferred to the release-signing track in
    `docs/ROADMAP.md`.

## Local Syntax Check

Run this without a device whenever a Maestro flow changes:

```sh
pnpm maestro:check
```

The command runs `maestro check-syntax` for every `.maestro/**/*.yaml` file.

## Android Emulator Smoke

Boot an Android emulator, then build and install the debug APK:

```sh
pnpm android:build-debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
pnpm maestro:android
```

The checked-in Android flow launches the WebView app, verifies the title menu,
starts a new game, advances the starter ceremony, opens the HUD menu, and checks
the touch routes for Party, Vocab, Inventory, Settings, and Quit-to-title.

For release QA, install the release-attached debug APK instead of the local
`android/app/build/outputs/apk/debug/app-debug.apk`, then run:

```sh
pnpm maestro:android
```

## iOS Simulator Pages Smoke

Boot an iOS simulator, then run:

```sh
pnpm maestro:ios
```

The iOS flow opens `https://arcade-cabinet.github.io/poki-soweli/` in Mobile
Safari, verifies the title menu, starts a new game, advances the starter
ceremony, opens the HUD menu, and checks the same touch route labels.

## Manual Checks Still Required

Maestro can prove the scripted smoke path on an emulator/simulator. Manual
release QA still needs:

-   One physical Android device using the release-attached debug APK.
-   One iOS Safari device or simulator pass against the deployed Pages URL.
-   A portrait and landscape rotation check.
-   A quick visual inspection for blank canvas, missing fonts, unsafe-area
    overlap, and blocking asset 404s.
