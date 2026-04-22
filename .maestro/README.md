# Maestro mobile QA

Maestro flows cover emulator/simulator smoke paths that Playwright cannot prove:

-   Android WebView via the debug APK package `com.pokisoweli.game`.
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

Run the iOS Pages smoke against a booted simulator:

```sh
pnpm maestro:ios
```
