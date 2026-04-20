---
title: poki soweli — Agent Entry Point
updated: 2026-04-19
status: current
---

# poki soweli

A creature-catching RPG whose world is named in toki pona. The player catches creatures in tall grass with a **poki** (net), builds a party of up to six, and beats seven **jan lawa** (region masters) to progress — picking up vocabulary by playing, never translating.

Repo path: `/Users/jbogaty/src/arcade-cabinet/toki-pona-tutor`. Game + repo was renamed from "Toki Town" → "poki soweli" during the Godot era; the pre-Godot branch this worktree is based on still uses the old name in some places — see `docs/STATE.md`.

## Orient yourself

1. Read `docs/STATE.md` for what's just landed and what's queued.
2. Read `docs/ARCHITECTURE.md` for the tech stack and content pipeline.
3. Read `docs/DESIGN.md` for the product vision (what the game IS and IS NOT).
4. Read `docs/ROADMAP.md` for the Phase-1 slice acceptance criteria.
5. Run `git status && git log --oneline -5 && gh pr list` before touching code.

## Critical rules (override defaults)

- **Docs > tests > code.** Docs describe the game; tests describe the code; code satisfies both. Never write tests to match code, and never write code without a doc-driven test. See `docs/STANDARDS.md`.
- **Fan-tasy is the only tileset family.** `public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/` is the source of truth. Do not mix in other tilesets — tonal inconsistency is what sank the previous playthrough. See `docs/ASSET_PIPELINE.md`.
- **Maps are build artifacts, never hand-authored.** The only way a map enters the repo is via a spec in `scripts/map-authoring/specs/<id>.ts` built by `pnpm author:build <id>` (or `pnpm author:all --all`). Both `src/tiled/<id>.tmx` (runtime) and `public/assets/maps/<id>.tmj` (archive) are regenerated from the spec. `pnpm author:verify` runs in `validate` + `prebuild` + CI and fails on any hand-edited or drifted `.tmx`. If you need to change a map: edit the spec, rebuild, commit both.
- **Every monster is catchable.** Tiering is about rarity + catch difficulty + animation depth — not whether the poki works. Animated sprites live in `public/assets/bosses/` (tier-2: rare spawns + set-piece fights, harder catch); static sprites in `public/assets/creatures/` (tier-1: common random encounters). Green dragon (`akesi_sewi`) is the final boss — legendary catch, only creature with a dedicated death animation (plays on defeat OR capture).
- **No hand-authored toki pona.** Every user-facing TP string round-trips through the Tatoeba corpus. See `docs/WRITING_RULES.md`. If `pnpm validate-tp` rejects a line, rewrite the EN, not the TP.
- **Always use pull requests.** Work on branches; don't push to main. Current branch: `feat/rpgjs-v5-pivot`.
- **No direct `localStorage` or `IndexedDB`** in feature code. Use `src/platform/persistence/preferences.ts` (small KV) or `src/platform/persistence/database.ts` (structured) — Capacitor-backed with web shims inside the wrapper only.

## Commands

```sh
pnpm install              # bootstrap
pnpm dev                  # vite dev server at http://localhost:5173/poki-soweli/
pnpm build-spine          # compile src/content/spine/ → generated/world.json
pnpm validate-tp          # gate: every EN string must exist in Tatoeba corpus
pnpm validate             # validate-challenges + validate-tp + author:verify
pnpm typecheck            # tsc --noEmit
pnpm test                 # both vitest projects (unit + integration)
pnpm test:unit            # pure-logic suite only (~5 s)
pnpm test:integration     # real RPG.js engine in-process via @rpgjs/testing
pnpm test:coverage        # unit coverage gate — 95% lines / 95% functions / 90% branches
pnpm build                # prebuild (validate + build-spine + typecheck) then vite build
```

## Structure

```
src/
├── standalone.ts           # dev entry: provideRpg(startServer) — client+server in one process
├── server.ts               # createServer with CapacitorSaveStrategy + tiledmap + main module
├── client.ts               # startGame with provideMmorpg (production)
├── config/
│   └── config.client.ts    # tilemap basePath, spritesheets
├── modules/
│   └── main/               # player hooks, NPC events, map registrations
├── platform/
│   └── persistence/        # Capacitor preferences + sqlite adapters + RPG.js save hook
├── tiled/                  # authored .tmx maps consumed by tiledMapFolderPlugin
└── content/
    ├── spine/              # hand-authored content JSON (species, moves, items, dialog)
    ├── generated/          # compiled world.json (committed for reproducibility)
    ├── corpus/             # vendored Tatoeba TP↔EN corpus (immutable)
    └── schema/             # Zod schemas — source of truth for content shape

public/assets/
├── tilesets/{core,…,indoor}/    # Fan-tasy 6-biome family, .tsx/.tmx intact
├── player/                       # Fan-tasy Main Character (idle/walk/slash)
├── bosses/                       # animated: green-dragon, dread-knight, slime, fire-skull, zombie-burster
├── creatures/                    # static wild-encounter sprites
├── npcs/                         # villagers, guards, warriors
├── combatants/                   # rival trainers, gym leaders (warriors_rogues_mages)
└── effects/                      # weapon + magical FX

docs/                      # specs — see list in docs/STATE.md
tests/                     # Vitest browser E2E harness
```

## What NOT to do

- Don't introduce tilesets outside the Fan-tasy family.
- Don't hand-author toki pona text.
- Don't edit `src/content/generated/world.json` directly — it's compiled from `spine/`.
- Don't use the green dragon for mid-game encounters — it's final-boss material.
- Don't write code before docs and tests exist for it.

## Active context

See `docs/STATE.md` — updated per session. Read it before assuming anything about what's landed.
