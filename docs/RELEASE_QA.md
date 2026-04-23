---
title: Release QA
updated: 2026-04-22
status: current
domain: quality
---

# Release QA

Manual smoke checklist for the current v0.2 release-hardening gate. This checklist validates the artifacts produced by `release.yml` and consumed by `cd.yml`; it does not cover signed release APK production, which is still deferred in `docs/ROADMAP.md` as T6-11.

## Inputs

-   GitHub release tag created by `release-please`.
-   Web bundle attached to that release: `rivers-reckoning-web-<tag>.tar.gz`.
-   Android debug APK attached to that release: `rivers-reckoning-<tag>-debug.apk`.
-   GitHub Pages deployment for the same tag at `https://arcade-cabinet.github.io/poki-soweli/`.

## Android Debug APK Smoke

1. Download `rivers-reckoning-<tag>-debug.apk` from the GitHub release assets.
2. Install on a physical Android device, with `APK_FILE` set to the downloaded release asset:

```sh
adb install -r "$APK_FILE"
```

1. Launch the app and confirm it reaches the title screen without a blank canvas.
2. Start a new game, pick a starter, walk to `greenwood_road`, trigger one wild encounter, use `utala`, then use `tawa`.
3. Open the HUD menu and verify Party, Items, Settings, and Quit-to-title routes respond to touch.
4. Quit to title, choose Continue, and verify the save resumes on the expected map.
5. Rotate the device once each direction and verify the app remains playable with no orientation lock.

If an Android emulator is available, run the same smoke path through Maestro
after installing the release-attached debug APK:

```sh
pnpm maestro:android
```

## GitHub Pages Smoke

1. Download `rivers-reckoning-web-<tag>.tar.gz` from the GitHub release assets and inspect that release-attached artifact, not a local rebuild.
2. Confirm the tarball contains `index.html`, `manifest.json`, `assets/`, `map/riverside_home.tmx`, and the other six runtime maps.
3. Confirm `index.html` references `/poki-soweli/manifest.json` and `/poki-soweli/assets/`, proving it was built for the Pages base.
4. Open `https://arcade-cabinet.github.io/poki-soweli/` in a clean browser profile.
5. Confirm the title screen appears and no asset 404s are visible in devtools.
6. Start a new game, pick a starter, and walk one screen far enough to prove map rendering and input.
7. Reload the page, choose Continue, and verify the save resumes.

## iOS Browser Smoke

1. Open the GitHub Pages URL on Mobile Safari.
2. Confirm the title screen appears, typography loads, and touch choices meet the 44 dp floor.
3. Start a new game, pick a starter, open the HUD menu, and return to the field.
4. Rotate portrait ↔ landscape and verify the responsive layout remains usable.

If an iOS simulator is available, run the Pages smoke path through Maestro:

```sh
pnpm maestro:ios
```

## Pass Criteria

-   No blank canvas on launch.
-   No blocking asset 404s on Pages.
-   New game, Continue, starter selection, movement, one wild encounter action, HUD menu, Settings route, and Quit-to-title all work on the tested devices.
-   Web artifact under test is the release-attached tarball, not a locally rebuilt bundle.
-   Android artifact under test is the release-attached debug APK, not a locally rebuilt APK.
