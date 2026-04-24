---
title: Rivers Reckoning
updated: 2026-04-24
status: current
---

# Rivers Reckoning

![engine](https://img.shields.io/badge/engine-RPG.js%20v5-6fb35c)
![status](https://img.shields.io/badge/version-v2%20in%20development-e8a04a)
![mobile](https://img.shields.io/badge/mobile%20first-yes-4a9d5a)
![tone](https://img.shields.io/badge/tone-cozy%20dark--fantasy-c87a26)

Rivers Reckoning is a cozy open-world creature-catching RPG for a kid audience. The player is Rivers, a kid who steps into a procedurally generated world and wanders indefinitely — catching creatures, building a party, talking to NPCs, taking optional challenges, spending gold at shops and inns. No finite story. No badge gates. No final boss.

Warm, not edgy. Kid-safe. No permadeath. Same seed = same world; different seed = different world.

## Where v2 stands

The project pivoted on 2026-04-24 from a finite seven-beat story (the v1 design — four region masters, badge gating, green-dragon ending) to a procedurally generated open world. v1 is preserved at git tag `v1.0.0-final` as a historical snapshot. **v2 is being refactored in place on `main`** — no parallel branch. See `docs/ROADMAP.md` for the 10-phase work map and `docs/plans/rivers-reckoning-v2.prq.md` for the full PRD.

**v2 is currently in Phase 1 (v1 teardown + scaffolding).** Phase 0 (spec lock) merged as PR #254. The engine may not boot cleanly between Phase 1 and Phase 2 — that's expected.

## What v2 is

- A **walk-first RPG** with JRPG combat underneath.
- **Seeded, persistent, open.** One seed per save. Chunks persist with their deltas. Revisit and the world is where you left it.
- **Rule-based procedural** — not noise. Grammar extracted from the seven v1 hand-crafted maps: biome archetypes, village archetypes, adjacency rules, landmark patterns.
- **Bestiary without dex panic.** Completion is optional and playful.
- **Loot-warm** — every gold and item drop comes from one universal log-scaled reward function.
- **Replayable.** New seed = new world.

## What v2 is not

- **Not finite.** No credits, no endgame, no required beats.
- **Not a branching story.** No flag graphs, quest chains, or gated content. Challenges are three-beat and self-contained.
- **Not level-gated.** Every chunk is reachable. Encounter difficulty scales with distance-from-start and player party strength together.
- **Not a Pokémon gym circuit.** No badges, masters, proofs.
- **Not a franchise clone.** Original names, genre-neutral language.
- **Not grind-first.** Wandering always pays better than camping.

## Run it

```sh
pnpm install
pnpm dev            # vite at http://localhost:5173/ (may fail to boot during Phase 1-2 refactor)
```

Use Node 22 LTS (`.node-version`) and pnpm 10.x.

## Orient yourself

| Doc | What it covers |
|---|---|
| `docs/DESIGN.md` | v2 product spec — what the game IS and IS NOT |
| `docs/ROADMAP.md` | v2 10-phase map, current phase, task IDs |
| `docs/plans/rivers-reckoning-v2.prq.md` | Full PRD with per-task acceptance |
| `docs/WORLD_GENERATION.md` | Chunk grid, biomes, villages, adjacency, Guide chunk |
| `docs/ECONOMY.md` | Reward function, tier-band scaling, XP curve, shop/inn pricing |
| `docs/DIALOG_POOL.md` | Role × context × mood × level-band NPC dialog |
| `docs/QUESTS.md` | 10 challenge cause kinds, effect primitives, lifecycle |
| `docs/ARCHITECTURE.md` | Stack layout (RPG.js v5 + Capacitor + vite + SQLite) |
| `docs/BRAND.md`, `docs/UX.md` | Visual system + tap-to-walk input model (carried from v1) |
| `docs/TESTING.md` | Five-layer testing strategy |
| `docs/archive/v1-story/` | v1 creative docs (archived; reference only) |
| `CLAUDE.md` | Agent-entry doc — orient rules, commands, structure |

## Commands

```sh
pnpm install              # bootstrap
pnpm dev                  # vite dev server (local base = /)
pnpm build                # vite build with prebuild gate
pnpm preview              # preview the built bundle

GITHUB_PAGES=true pnpm build   # Pages build (base = /poki-soweli/)
CAPACITOR=true pnpm build      # Capacitor build (base = ./)

pnpm typecheck            # tsc --noEmit across all TS surfaces
pnpm format:src           # Prettier pass over src/
pnpm workflow:check       # actionlint + shellcheck for .github/workflows/

pnpm test                 # both vitest projects
pnpm test:unit            # pure/build-time suite
pnpm test:integration     # real RPG.js engine in-process
pnpm test:coverage        # coverage gate on unit project
pnpm test:e2e:smoke       # Playwright boot smoke
pnpm test:e2e:full        # full Playwright suite (local)

pnpm android:build-debug  # Capacitor debug APK
pnpm maestro:android      # Android emulator smoke
pnpm maestro:ios          # iOS Safari Pages smoke
```

v1 map-authoring commands (`pnpm author:*`, `pnpm build-spine`, `pnpm validate`) still work while v2 is under construction; they are scheduled for retirement in Phase 9.

## Structure

```
src/
├── modules/
│   ├── main/             # v1 engine modules — being torn down in Phase 1
│   ├── world-generator.ts
│   ├── chunk-store.ts
│   ├── reward-function.ts
│   ├── dialog-pool.ts
│   ├── challenge-template.ts
│   └── rumor-resolver.ts
└── content/
    ├── spine/species/    # 43 species (carry forward from v1)
    ├── spine/moves/      # 17 moves (carry forward from v1)
    ├── spine/items/      # items (extended in Phase 5)
    ├── dialog_pool/      # authored in Phase 6
    ├── names/            # NPC name pools (Phase 6)
    ├── challenges/       # challenge templates (Phase 7)
    └── economy.json      # tuning config (Phase 4)

docs/
├── DESIGN.md             # v2 product spec
├── WORLD_GENERATION.md   # v2 world-gen spec
├── ECONOMY.md            # v2 economy spec
├── DIALOG_POOL.md        # v2 dialog spec
├── QUESTS.md             # v2 challenge spec
├── ROADMAP.md            # v2 phase map
├── plans/rivers-reckoning-v2.prq.md   # PRD
└── archive/v1-story/     # v1 creative docs (reference)

tests/
├── build-time/           # Vitest unit suite (pure logic)
├── integration/          # @rpgjs/testing in-process engine suite
└── e2e/                  # Playwright real-browser suite
```

## Contributing

- Read `CLAUDE.md` and the spec doc for whatever system you're touching before making changes.
- Work on a feature branch off `main`. Open a PR against `main`. Never push direct.
- CI must be green before merge; address every review comment.
- [Conventional Commits](https://www.conventionalcommits.org/) always (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `perf:` / `test:` / `ci:` / `build:`).
- Squash-merge.
- GitHub Actions are pinned to exact commit SHAs. Dependabot `@vN` bumps are converted to SHA pins.

## License

- **Code** — see `LICENSE`.
- **Fonts** — Nunito, Fredoka, JetBrains Mono ship under SIL Open Font License 1.1. Each family directory under `public/assets/fonts/` retains its original `OFL.txt`.
- **Art assets** — Fan-tasy tileset packs and friends; see `public/assets/CREDITS.md` for per-pack provenance.
