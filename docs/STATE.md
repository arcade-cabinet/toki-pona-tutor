---
title: Current State
updated: 2026-04-22
status: current
domain: context
---

# Current State

**Branch:** intentionally not hard-coded here. Check `git branch --show-current`.

**Product:** Rivers Reckoning, a native-English creature-catching RPG for web and Android debug APK builds. Rivers explores a fantasy world, catches monsters, investigates local trouble, solves quests, defeats four region masters, and reaches the green-dragon finale.

**Stack:** RPG.js v5 beta + CanvasEngine/Pixi 8 + Capacitor 8 + spec-generated Tiled maps + JSON/Zod gameplay configuration. See `docs/ARCHITECTURE.md`.

**Toolchain:** Node 22 LTS + pnpm 10.x. GitHub Actions are pinned to Node 22, and local release/build evidence should use the same major version.

**Base paths:** local dev/preview is `/`, GitHub Pages is `/poki-soweli/`, and Capacitor is `./`.

## Orientation

Read these before code changes:

1. `docs/ARCHITECTURE.md` — stack, pipelines, runtime layout.
2. `docs/TESTING.md` — gate matrix, visual audit, local/full browser posture.
3. `docs/DEPLOYMENT.md` — CI, release, CD, Pages, debug APK handoff.
4. `docs/DESIGN.md` — product direction and non-goals.
5. `docs/BRAND.md` — visual identity and HUD chrome.
6. `docs/ART_DIRECTION.md` — tile curation and pending-pack bakeoff.
7. `docs/UX.md` — mobile-first controls and `data-testid` contracts.
8. `docs/ROADMAP.md` — current v1 completion backlog.

Then run `git status` and `git log --oneline -10`.

## Run And Build

```sh
pnpm install
pnpm dev
pnpm validate
pnpm build-spine
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e:smoke
pnpm build
GITHUB_PAGES=true pnpm build
pnpm android:build-debug
```

`pnpm dev` serves `http://localhost:5173/` by default. If 5173 is in use, set `E2E_PORT` for Playwright or stop the other server.

## What Is Implemented

- **Seven generated maps:** `riverside_home`, `greenwood_road`, `highridge_pass`, `lakehaven`, `frostvale`, `dreadpeak_cavern`, and `rivergate_approach`.
- **Spec-driven map tooling:** maps emit `.tmx`, `.tmj`, and preview PNG artifacts from TypeScript specs; `pnpm author:verify` guards drift.
- **Curated art boundary:** palette entries route through `src/content/art/tilesets.json`, with rejected tiles documented rather than forgotten.
- **Native-English content:** dialog, quest copy, UI copy, item/species labels, and Field Notes are authored in English.
- **Clue journal:** `src/content/clues.json` owns investigation clues; legacy-named persistence remains only for save compatibility.
- **Runtime gameplay config:** maps, events, starters, progression, trainers, shops, quests, combat formulas, visuals, audio, UI, and Field Notes are JSON-backed.
- **Playable current arc:** starter ceremony, wild encounters, capture/defeat, first rival, four region masters, side quests, shops, final route, green dragon, credits, save/continue, and respawn are wired.
- **Mobile HUD:** tap-to-walk, contextual hint, HUD menu, pause routes, party/bestiary/inventory/clues/settings/save flows, and touch-target tests exist.
- **Release plumbing:** `ci.yml` handles PR gates and reviewer artifacts, `release.yml` creates versioned release artifacts through release-please, and `cd.yml` consumes the completed `workflow_run` to attach release assets and deploy Pages.

## Verified Baseline

The local gate set for this state is:

- `pnpm validate`
- `pnpm build-spine`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:e2e:smoke`
- `pnpm build`
- `GITHUB_PAGES=true pnpm build`
- `pnpm android:build-debug`

Additional release/tooling checks:

- `pnpm author:verify`
- `pnpm author:all --all`
- `pnpm author:all --all --dry-run`
- `pnpm workflow:check`
- `pnpm maestro:check`
- `pnpm maestro:android` on the visible `Maestro_ANDROID_pixel_6_android-33`
  emulator after installing a locally built debug APK
- `pnpm release:smoke-artifacts "$RELEASE_TAG"` after a Pages build and debug APK build

The full browser suite currently has 27 full browser tests across 15 files. It remains local rather than a PR gate because it is slower and more visually diagnostic than the smoke gate.

## Visual Verification

The visual-audit suite captures PNGs for:

- desktop title choices
- desktop starter map canvas
- mobile starter choice dialog
- mobile pause overlay
- all seven authored map canvases

Curated copies live under `docs/screenshots/visual-audit/`. The golden-path browser spec also emits periodic screenshot, JSON diagnostic, and Markdown checklist artifacts that cover map ID, player position, collision context, visible HUD state, tile context, camera scale, and visual-cohesion warnings.

These artifacts are acceptance inputs, not decorative output. For any UI/map/tile change, inspect them before claiming the game still looks right.

## Hard Rules

- **Native-English story only.** Do not rebuild a corpus/translation layer or language-learning mechanics.
- **Maps are build artifacts.** Edit specs and regenerate. Never hand-edit emitted `.tmx`, `.tmj`, or preview PNGs.
- **Every monster is catchable.** Difficulty is rarity/catch odds/encounter context, not an uncapturable flag.
- **Mobile-first.** Every action must be reachable by mouse/tap; keyboard is a desktop shortcut.
- **No direct browser storage.** Use the persistence wrappers.
- **Docs > tests > code.** Update docs first when scope changes.
- **Integration and headed E2E carry player-visible behavior.** Unit tests are for pure logic and build-time contracts.
- **Always use pull requests.** Do not push directly to `main`.

## Current Limits

- **The game is not a finished v1.0.** The current arc is playable, but still needs deeper quest density, richer narrative payoff, combat tuning, final audio, stronger art direction, and broader device proof.
- **Map composition remains the largest product-quality gap.** Several maps are functionally valid but still too sparse or visually inconsistent for a polished 16-bit RPG feel.
- **The Android APK is debug-only.** Signed release APK support is deferred until keystore, `assembleRelease`, release-asset attachment, and physical-device QA are implemented.
- **Maestro is partially device-proven.** Android debug APK smoke passed on a visible Android emulator with the locally built debug APK; iOS Pages simulator proof and release-attached APK proof remain release-QA work.
- **Playwright in CI is smoke-only.** Full browser progression and visual audit are local gates today.
- **RPG.js v5 is beta.** Package API churn remains possible.

## Current Emphasis

The active pivot is to complete Rivers Reckoning as a native-English game rather than preserving the former language-learning premise. The immediate priority is to keep run/build/deploy green while replacing product-facing vocabulary/corpus claims with clue, investigation, quest, and narrative systems that support a richer beginning-to-end game.
