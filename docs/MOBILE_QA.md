---
title: Mobile QA
updated: 2026-04-23
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
    `com.riversreckoning.game`.
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

The checked-in Android flow launches the WebView app in landscape, verifies the
title menu, starts a new game, point-taps to the starter mentor on
`riverside_home`, advances the starter ceremony through the React dialog panel,
chooses Ashcat, opens the HUD menu, and checks the touch routes for Party,
Settings, Gear, Save, and Quit-to-title.

Local proof: this flow passed on the visible
`Maestro_ANDROID_pixel_6_android-33` emulator after installing the locally built
debug APK. Release proof still needs the same flow against the release-attached
APK.

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
Safari, sets landscape orientation, verifies the title menu, starts a new game,
uses the same point-tap starter-mentor path, advances the starter ceremony,
opens the HUD menu, and checks the same touch route labels.

This iOS flow is syntax-checked but not yet simulator-proven because it must run
against the deployed Pages artifact.

## Manual Checks Still Required

Maestro can prove the scripted smoke path on an emulator/simulator. Manual
release QA still needs:

-   One physical Android device using the release-attached debug APK.
-   One iOS Safari device or simulator pass against the deployed Pages URL.
-   A portrait and landscape rotation check.
-   A quick visual inspection for blank canvas, missing fonts, unsafe-area
    overlap, and blocking asset 404s.
