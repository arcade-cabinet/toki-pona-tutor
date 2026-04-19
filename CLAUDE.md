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
- **Tiled `.tmx/.tsx` is the map authoring format.** Regions are authored in Tiled, not as JSON tile arrays. Region logic (NPCs, warps, encounters) lives either in the `.tmx` object layers or in `<id>.logic.json` alongside.
- **Creatures vs bosses are tiered by animation depth.** Animated sprites go in `public/assets/bosses/`; static sprites in `public/assets/creatures/`. Green dragon is the designated final boss (only creature with a death animation).
- **No hand-authored toki pona.** Every user-facing TP string round-trips through the Tatoeba corpus. See `docs/WRITING_RULES.md`. If `pnpm validate-tp` rejects a line, rewrite the EN, not the TP.
- **Always use pull requests.** Work on branches; don't push to main. Current branch: `spike/phaser-koota-revive`.

## Commands

```sh
pnpm install          # bootstrap
pnpm dev              # vite dev server at http://localhost:5173/toki-pona-tutor/
pnpm build-spine      # compile src/content/spine/ → generated/world.json
pnpm validate-tp      # gate: every EN string must exist in Tatoeba corpus
pnpm validate         # validate-challenges + validate-tp
pnpm typecheck        # tsc --noEmit
pnpm build            # prebuild (validate + build-spine + typecheck) then vite build
```

## Structure

```
src/
├── game/                   # Phaser scenes, Solid overlays, Koota ECS, combat engine
├── content/
│   ├── spine/              # hand-authored content JSON (species, moves, regions, items, dialog)
│   ├── generated/          # compiled world.json (committed for reproducibility)
│   ├── corpus/             # vendored Tatoeba TP↔EN corpus (immutable)
│   └── schema/             # Zod schemas — source of truth for content shape
├── components/             # React shell (menus, HUD, non-game UI)
└── types/

public/assets/
├── tilesets/{core,…,indoor}/    # Fan-tasy 6-biome family, .tsx/.tmx intact
├── player/                       # Fan-tasy Main Character (idle/walk/slash)
├── bosses/                       # animated: green-dragon, dread-knight, slime, fire-skull, zombie-burster
├── creatures/                    # static wild-encounter sprites
├── npcs/                         # villagers, guards, warriors
├── combatants/                   # rival trainers, gym leaders (warriors_rogues_mages)
└── effects/                      # weapon + magical FX

docs/                      # specs — see list in docs/STATE.md
tests/                     # Vitest browser E2E harness + playbook factory (Phase S work)
```

## What NOT to do

- Don't introduce tilesets outside the Fan-tasy family.
- Don't hand-author toki pona text.
- Don't edit `src/content/generated/world.json` directly — it's compiled from `spine/`.
- Don't use the green dragon for mid-game encounters — it's final-boss material.
- Don't write code before docs and tests exist for it.

## Active context

See `docs/STATE.md` — updated per session. Read it before assuming anything about what's landed.
