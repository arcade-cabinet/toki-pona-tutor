# Maestro mobile QA

Maestro flows cover emulator/simulator smoke paths that Playwright cannot prove:

-   Android WebView via the debug APK package `com.riversreckoning.game`.
-   iOS Safari against the deployed GitHub Pages URL until a Capacitor iOS target exists.

Run syntax checks without a device:

```sh
pnpm maestro:check
```

Run against a booted Android emulator after installing the debug APK:

```sh
pnpm android:build-debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
pnpm maestro:android
```

The Android flow sets landscape orientation, starts a fresh game, point-taps to
the starter mentor on `riverside_home`, advances dialog through the React
dialog panel, chooses Ashcat, and verifies the pause/save touch routes.

Run the iOS Pages smoke against a booted simulator:

```sh
pnpm maestro:ios
```

The iOS flow mirrors the Android path in Mobile Safari. It depends on the
currently deployed GitHub Pages artifact, so treat local Android proof and iOS
Pages proof as separate release-QA gates.
