---
title: Setup
updated: 2026-04-22
status: current
domain: ops
---

# Rivers Reckoning Contributor Setup

Fresh clone to running game:

```sh
git clone git@github.com:arcade-cabinet/poki-soweli.git
cd poki-soweli
pnpm install
pnpm dev
```

`pnpm dev` serves `http://localhost:5173/` in RPG.js standalone mode.

Base paths:

- local dev/preview is `/`
- GitHub Pages is `/poki-soweli/`
- Capacitor is `./`

## Prerequisites

- Node 22 LTS. The repo includes `.node-version`, and `package.json` constrains `engines.node` to Node 22 because CI/release builds are pinned there.
- pnpm 10+
- Git 2.40+
- Java 21 and Android SDK for local APK work
- actionlint and shellcheck if editing GitHub Actions

`sql.js` remains pinned to `1.11.0` in dependencies and overrides until the Capacitor SQLite web shim is revalidated end to end.

If a local Pages or Capacitor build hangs after Vite starts, first verify `node -v` reports `v22.x`; do not treat a Node 24 build result as release evidence.

## Common Gates

```sh
pnpm validate
pnpm build-spine
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e:smoke
pnpm build
```

If you touch workflows:

```sh
pnpm workflow:check
```

If you touch maps:

```sh
pnpm author:all --all
pnpm author:verify
```

## Content Pipeline

- Maps: edit `scripts/map-authoring/specs/<id>.ts`, then run `pnpm author:build <id>` or `pnpm author:all --all`.
- Spine content: edit `src/content/spine/**/*.json`, then run `pnpm build-spine`.
- Gameplay config: edit `src/content/gameplay/*.json`; schemas validate on import/build.
- Clues: edit `src/content/clues.json`; `pnpm validate-challenges` checks challenge references.

Do not hand-edit generated `src/tiled/*.tmx`, `public/assets/maps/*.tmj`, preview PNGs, or `src/content/generated/world.json`.

## Android Debug APK

```sh
pnpm android:build-debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The Android scaffold is generated when missing and is not committed.

## Tests

```sh
pnpm test:unit
pnpm test:integration
pnpm test:e2e:smoke
pnpm test:e2e:full
```

Full E2E is local and visual-diagnostic. Inspect screenshots/diagnostics when UI, art, or maps change.

## Next

- Read `CLAUDE.md` and `AGENTS.md`.
- Read `docs/STATE.md` for current limits.
- Read `docs/ROADMAP.md` before changing scope.
