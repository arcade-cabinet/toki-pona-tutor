---
title: Deployment
updated: 2026-04-20
status: current
domain: ops
---

# Deployment

## Targets

poki soweli ships to three surfaces, all from the same Vite bundle:

| Target | How | Where |
|--------|-----|-------|
| Web (prod) | GitHub Pages | `https://arcade-cabinet.github.io/toki-pona-tutor/` |
| Web (dev) | `pnpm dev` | `http://localhost:5173/toki-pona-tutor/` |
| Android (debug) | CI APK artifact on each PR | GitHub Actions artifacts, 14d retention |
| Android (release) | _not yet wired_ | will use signed APK via `release.yml` once Phase-1 slice ships |
| iOS | _not yet wired_ | Capacitor iOS platform; blocked on macOS CI runner |

## Capacitor

`capacitor.config.ts` at repo root:

- `appId: com.pokisoweli.game`
- `appName: poki soweli`
- `webDir: dist`
- SplashScreen: 1200ms, `#111111` bg, no spinner
- StatusBar: DARK style, `#111111` bg

The Capacitor Android project under `android/` is **not tracked in
git** (see `.gitignore`). Every build regenerates it via:

```sh
pnpm exec cap add android     # first time on a fresh clone
pnpm exec cap sync android    # after each web-bundle rebuild
```

CI does this automatically; locally you only need it if you're
debugging a native-specific issue.

## CI pipelines

Three workflows in `.github/workflows/`:

### `content-validate.yml` — PR gate

Runs on every PR:

1. `pnpm install --ignore-workspace --frozen-lockfile`
2. `pnpm validate-challenges` — static challenge data
3. `pnpm validate-tp` — every multi-word TP string must round-trip Tatoeba
4. `pnpm build-spine` — compile `src/content/spine/` → `generated/world.json`
5. `pnpm typecheck` — `tsc --noEmit` with upstream-library filter
6. `pnpm build` — the full prebuild chain + `vite build`

`pnpm validate` (which the `prebuild` step invokes) now includes
`pnpm author:verify` — the map-authoring contract gate (see
`docs/STANDARDS.md § Map authoring`).

### `android-apk.yml` — PR APK artifact

Runs on every PR. Builds the web bundle, initialises the Capacitor
Android project (idempotent — only `cap add android` if missing),
syncs, and runs `./gradlew assembleDebug`. Uploads
`app-debug.apk` as an artifact named
`poki-soweli-debug-apk-<PR_NUMBER>` with 14-day retention.

Reviewers sideload the APK to test on a device:

```sh
adb install app-debug.apk
```

### `deploy.yml` — Pages deploy on main

Runs on `push: main`. Builds the web bundle and deploys to
GitHub Pages at the `toki-pona-tutor/` base path.

## What's still missing

The global-standards `ci.yml` / `release.yml` / `cd.yml` trifecta is
not yet split out. Today:

- `content-validate.yml` serves as the CI gate (equivalent to `ci.yml`)
- `android-apk.yml` is PR-artifact-only (not release-signed)
- `deploy.yml` covers the CD leg for web

A follow-up will land once the Phase-1 slice is E2E-green through
the Vitest browser harness:

1. `release-please-config.json` + `.release-please-manifest.json`
2. `.github/workflows/release.yml` — signed APK + versioned web bundle
3. Split `cd.yml` from `deploy.yml` to consume release artifacts
4. `.github/dependabot.yml` — npm + github-actions, weekly, grouped

## Local preview

```sh
pnpm install
pnpm prebuild   # validate + build-spine + typecheck
pnpm build      # vite build → dist/
pnpm preview    # preview the built bundle at http://localhost:4173/toki-pona-tutor/
```

For native preview on an Android emulator:

```sh
pnpm build
pnpm exec cap sync android
pnpm exec cap open android    # opens Android Studio; hit Run
```
