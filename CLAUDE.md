---
title: poki soweli — Agent Entry Point
updated: 2026-04-19
status: current
---

# poki soweli

A creature-catching RPG whose world is named in toki pona. The player catches creatures in tall grass with a **poki** (net), builds a party of up to six, and beats seven **jan lawa** (region masters) to progress — picking up vocabulary by playing, never translating.

Repo path: `/Users/jbogaty/src/arcade-cabinet/toki-pona-tutor`. Game + repo was renamed from "Toki Town" → "poki soweli" during the Godot era; the pre-Godot branch this worktree is based on still uses the old name in some places — see `docs/STATE.md`.

## Orient yourself

Before touching code, read these in order:

1. `docs/STATE.md` — branch state, running commands, hard rules, known limits.
2. `docs/ROADMAP.md` — single source of truth for what's done (✅), partial (🟡), open (⬜). Every task has a stable `T<phase>-<n>` ID.
3. `docs/ARCHITECTURE.md` — stack layout + the three layers (content pipeline → pure game modules → runtime wiring).
4. `docs/DESIGN.md` — product vision (what the game IS and IS NOT).
5. `docs/BRAND.md` — palette, typography, chrome patterns. Every UI surface draws from these tokens.
6. `docs/UX.md` — HUD architecture, tap-to-walk input model, `.ce` component registration, data-testid naming.
7. `docs/TESTING.md` — four-layer testing strategy + E2E-first policy.

Then: `git status && git log --oneline -10 && gh pr list`.

## Critical rules (override defaults)

- **Docs > tests > code.** Docs describe the game; tests describe the code; code satisfies both. Never write tests to match code, and never write code without a doc-driven test. See `docs/STANDARDS.md`.
- **Fan-tasy is the only tileset family.** `public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/` is the source of truth. Do not mix in other tilesets — tonal inconsistency is what sank the previous playthrough. See `docs/ASSET_PIPELINE.md`.
- **Maps are build artifacts, never hand-authored.** The only way a map enters the repo is via a spec in `scripts/map-authoring/specs/<id>.ts` built by `pnpm author:build <id>` (or `pnpm author:all --all`). Both `src/tiled/<id>.tmx` (runtime) and `public/assets/maps/<id>.tmj` (archive) are regenerated from the spec. `pnpm author:verify` runs in `validate` + `prebuild` + CI and fails on any hand-edited or drifted `.tmx`. If you need to change a map: edit the spec, rebuild, commit both.
- **Every monster is catchable.** Tiering is about rarity + catch difficulty + animation depth — not whether the poki works. Animated sprites live in `public/assets/bosses/` (tier-2: rare spawns + set-piece fights, harder catch); static sprites in `public/assets/creatures/` (tier-1: common random encounters). Green dragon (`akesi_sewi`) is the final boss — legendary catch, only creature with a dedicated death animation (plays on defeat OR capture).
- **No hand-authored toki pona.** Every user-facing TP string round-trips through the Tatoeba corpus. See `docs/WRITING_RULES.md`. If `pnpm validate-tp` rejects a line, rewrite the EN, not the TP.
- **Always use pull requests.** Work on branches; don't push to `main`. Never merge with `--admin` / bypass checks. Branch names are ephemeral; check `git branch --show-current` rather than assuming.
- **E2E > unit.** Integration + E2E tests (real engine, real browser) are what prove the game works. Unit tests are reserved for pure-logic/math/formulas. See `docs/TESTING.md`.
- **Mobile-first, no fixed layout.** Tap-to-walk is primary input; keyboard is a desktop shortcut. No persistent A/B/d-pad cluster. Full HUD spec in `docs/UX.md`.
- **GitHub Actions pinned to exact SHAs** (latest stable). Never use `@vN` tags.
- **No CDN at runtime.** Fonts, wasm, assets — all self-hosted under `public/assets/`.
- **No copyrighted / trademarked references** in docs, code, comments, or assets. The game is "poki soweli — a creature-catching RPG." Never reference Pokemon/Pokedex/Pokeball/Final Fantasy/etc. Catalog is `lipu soweli`; net is `poki`; region masters are `jan lawa`.
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
pnpm test:e2e:smoke       # real browser via Playwright — boot + golden-path sanity
pnpm test:e2e:full        # full Playwright suite (local only, not CI per-push)
pnpm build                # prebuild (validate + build-spine + typecheck) then vite build
```

Build env for deploy targets (CI sets these; rarely needed locally):

```sh
GITHUB_PAGES=true pnpm build   # base='/poki-soweli/' for Pages
CAPACITOR=true    pnpm build   # base='./' for native WebView
# No env set → base='/' for dev/preview
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
tests/
├── build-time/            # unit — pure-logic, vitest node env
├── integration/           # real engine in-process via @rpgjs/testing
└── e2e/
    ├── smoke/             # runs in CI — boot + golden-path sanity only
    └── *.spec.ts          # full Playwright suite, local default
```

## What NOT to do

- Don't introduce tilesets outside the Fan-tasy family.
- Don't hand-author toki pona text.
- Don't edit `src/content/generated/world.json` directly — it's compiled from `spine/`.
- Don't use the green dragon for mid-game encounters — it's final-boss material.
- Don't write code before docs and tests exist for it.

## Active context

See `docs/STATE.md` — updated per session. Read it before assuming anything about what's landed.
