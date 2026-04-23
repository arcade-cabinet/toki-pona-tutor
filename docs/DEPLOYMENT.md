---
title: Deployment
updated: 2026-04-22
status: current
domain: ops
---

# Deployment

## Targets

Rivers Reckoning is built for these surfaces from the same Vite bundle:

| Target                     | How                                           | Where                                              |
| -------------------------- | --------------------------------------------- | -------------------------------------------------- |
| Web (prod)                 | GitHub Pages                                  | `https://arcade-cabinet.github.io/poki-soweli/`    |
| Web (dev)                  | `pnpm dev`                                    | `http://localhost:5173/`                           |
| Android (debug)            | CI APK artifact on each PR                    | GitHub Actions artifacts, 14d retention            |
| Android (release artifact) | debug APK artifact on release-please releases | GitHub release assets                              |
| iOS                        | _not yet wired_                               | Capacitor iOS platform; blocked on macOS CI runner |

## Base-path contract

The same app ships with three URL bases:

-   local dev/preview: `/`
-   GitHub Pages: `/poki-soweli/`
-   Capacitor WebView: `./`

Those bases are selected in `vite.config.ts` via `GITHUB_PAGES=true` and `CAPACITOR=true`. The deploy flow is only correct when the build step sets the matching environment variable for the target it is producing.

## Capacitor

`capacitor.config.ts` at repo root:

-   `appId: com.riversreckoning.game`
-   `appName: Rivers Reckoning`
-   `webDir: dist`
-   SplashScreen: 1200ms, `#111111` bg, no spinner
-   StatusBar: DARK style, `#111111` bg

The Capacitor Android project under `android/` is **not tracked in
git** (see `.gitignore`). Every build regenerates it via:

```sh
pnpm exec cap add android     # first time on a fresh clone
pnpm exec cap sync android    # after each web-bundle rebuild
```

CI does this automatically when the scaffold is absent. Locally you only need it if you're debugging a native-specific issue or verifying the APK path yourself.

Current release automation is configured to publish a debug APK only. Signed release APK generation is a deferred roadmap item; `release.yml` does not read Android keystore secrets or run `assembleRelease` in this phase.

## CI pipelines

Four workflows in `.github/workflows/` carry the app handoff:
`automerge.yml`, `ci.yml`, `release.yml`, and `cd.yml`. `pnpm
workflow:check` validates all four workflow files.

Before editing any workflow, run `pnpm workflow:check` locally. It combines `actionlint` with `shellcheck` over every workflow `run:` block. The unit guards `tests/build-time/workflow-contract.test.ts` and `tests/build-time/release-artifacts.test.ts` pin the release/CD handoff, debug-APK-only release output, full-SHA action pinning, and release metadata/file-name contract.

### `ci.yml` — PR gate + reviewer artifacts

Runs on every PR:

1. `conventional-commits` job: validates the PR title and branch commit subjects for release-please-safe squash merges
2. `unit` job: `validate-challenges`, `author:verify`, `build-spine`, `typecheck`, and `test:coverage`
3. `integration` job: `pnpm test:integration`
4. `e2e-smoke` job: Playwright boot smoke in headed Chromium under `xvfb`
5. `build` job: `GITHUB_PAGES=true pnpm build` plus the web-size audit
6. `android-debug-apk` job: `CAPACITOR=true pnpm build`, `cap add android` if needed, `cap sync android`, `./gradlew assembleDebug`

`pnpm build` runs `scripts/deploy/prune-deploy-assets.mjs` after Vite finishes. The source Fan-tasy packs stay under `public/assets/tilesets/` for authoring and map-renderer validation, but deployable `dist/assets/tilesets/` is rebuilt as a runtime allowlist derived from `src/tiled/*.tmx`. This keeps Pages and Capacitor bundles under the 10 MB gzip target without deleting authoring fixtures.

Artifacts produced on PRs:

-   `web-bundle`
-   `coverage-lcov`
-   `rivers-reckoning-debug-apk-<PR_NUMBER>`

Reviewers sideload the APK to test on a device:

```sh
adb install app-debug.apk
```

### `automerge.yml` — bot PR auto-merge

Runs on `pull_request_target` for bot PRs only. Dependabot minor and patch
updates are approved and enrolled in squash auto-merge; semver-major updates
stay manual. Same-repository release-please PRs with a `release-please--*`
branch are also approved and enrolled in squash auto-merge so the release chain
can move once required checks and branch protection are satisfied, regardless of
whether the release PAT authors them as a bot or as the PAT owner.

### `release.yml` — release-please + versioned build artifacts

Runs on `push: main`.

1. `release-please` runs with `secrets.CI_GITHUB_TOKEN_PAT`, falling back to the shared `secrets.CI_GITHUB_TOKEN` secret used by sibling arcade-cabinet repositories
2. when `release_created == true`, the workflow checks out the released SHA, not moving `main`
3. it builds:
    - `rivers-reckoning-web-<tag>.tar.gz` with `GITHUB_PAGES=true`
    - `rivers-reckoning-<tag>-debug.apk` with `CAPACITOR=true`
4. it uploads workflow artifacts:
    - `release-metadata`
    - `web-bundle-<tag>`
    - `android-debug-apk-<tag>`

`release-metadata/release.json` is the handoff contract. It includes `tag_name`, `version`, `sha`, the release body, and the exact artifact names that `cd.yml` must fetch. After a local Pages web build (`GITHUB_PAGES=true pnpm build`) and Android debug build, `pnpm release:smoke-artifacts "$RELEASE_TAG"` packages the current `dist/` plus `android/app/build/outputs/apk/debug/app-debug.apk`, requires the web bundle to use the `/poki-soweli/` Pages base, verifies the deployed manifest/asset manifests and runtime `.tmx` maps are present in the tarball, and validates the same metadata/file-name contract without needing a remote GitHub run.

### `cd.yml` — consume release artifacts, attach to release, deploy Pages

Runs on successful completion of `release.yml` via `workflow_run`, plus manual `workflow_dispatch` redeploys.

On `workflow_run`, it:

1. downloads `release-metadata` from the completed `release.yml` run
2. downloads the versioned web bundle and debug APK from that same run
3. attaches both files to the existing GitHub release for `tag_name`
4. untars the web bundle into `dist/`
5. deploys `dist/` to GitHub Pages

On manual dispatch, it skips the workflow-artifact download path and redeploys from a previously attached web bundle on the GitHub release.

## Local preview

```sh
pnpm install
pnpm prebuild   # validate + build-spine + typecheck
pnpm build      # vite build → dist/
pnpm preview    # preview the most recently built dist/
```

For native preview on an Android emulator:

```sh
pnpm android:build-debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
pnpm maestro:android
```

For iOS simulator Pages smoke, use Mobile Safari via Maestro until the Capacitor
iOS platform exists:

```sh
pnpm maestro:ios
```

## Release QA

After a remote release proves the `release.yml` → `cd.yml` artifact handoff, run
the manual checklist in `docs/RELEASE_QA.md` and the Maestro emulator/simulator
flows in `docs/MOBILE_QA.md`. Those checks intentionally test the
release-attached debug APK and deployed Pages URL, not a locally rebuilt APK or
local preview server.

## Deferred: signed release APK

The repository still contains `scripts/capacitor/configure-release-signing.mjs` for the future signed-release track, but signed APK generation is not part of the current release automation. Before enabling it, add remote CI proof for the keystore secret path, `assembleRelease`, release-asset attachment, and physical-device QA.
