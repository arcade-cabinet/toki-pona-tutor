---
title: Current State
updated: 2026-04-19
status: current
domain: context
---

# Where we are

**2026-04-19 — mid-pivot.** The game just turned from a procedurally-generated village tutor into a hand-authored Pokemon-shape RPG. Every design call about the pivot is locked; see `docs/ARCHITECTURE.md`.

## Immediately before this state

PR #22 merged: WASD sitelen rendering fix, `AdventureAudio` bus-driven SFX layer, `scripts/validate-tp.mjs` informational validator. Main is clean.

## What's landing next

**Wave 0 — infra (this PR, `feat/declarative-content-pipeline`).** Contents:

- Three architecture docs (`ARCHITECTURE.md`, `AGENT_TEAMS.md`, `STATE.md`) — landed first in this PR
- Zod schemas for every content type in `src/content/schema/`
- `zodToKootaTrait()` helper
- `scripts/build-spine.mjs` — reads spine, validates schemas, resolves Tatoeba, emits `generated/world.json`
- `pnpm validate-tp` wired as a mandatory prebuild step
- `pnpm build-spine` script
- `.github/workflows/content-validate.yml` — CI gate
- Initial spine files for region 1 (`ma tomo lili`) — minimal stub, real content lands in Wave 2
- Agent-brief templates in `docs/agent-briefs/`
- `scripts/worktree-janitor.mjs`
- Delete procgen: `src/game/procgen/`, `NewGameModal`, seed HUD chip
- Delete `src/content/village.json` (replaced by spine)

## After Wave 0

**Wave 1 — schema audit (1 agent).** Reads the Zod schemas, writes `docs/schema/*.md` human-readable references.

**Wave 2 — content fanout (up to 5 agents parallel).**
- species team: 15–20 creature JSONs
- moves team: ~15 move JSONs
- region-1 team: ma tomo lili full content
- region-2 team: nasin wan (first route) full content
- items team: poki variants + healing items

**Wave 3 — engine integration (me).** Rip procgen, rewire scenes to world.json, wire catch/party/Pokedex.

**Wave 4 — content fanout (up to 5 agents parallel).** Regions 3–6, dialog polish, balance pass.

## Locked design decisions

- **Pokemon-shape** RPG. Party of up to 6. Catch wild creatures with **poki** (net). Five types: seli / telo / kasi / lete / wawa. Seven regions planned. Set-piece jan-lawa fights gate region boundaries. No player stats — party is the character sheet.
- **ma tomo lili = the starter village.** jan Sewi is the starter-giver (Professor Oak role); same NPC, new job.
- **Tall-grass random encounters** exist and are the B-gameplay to the A-gameplay of set-piece fights.
- **Hand-authored TP is banned.** Every multi-word TP string must round-trip through Tatoeba. Single-word TP (dictionary entries) is vetted and exempt.
- **Declarative content pipeline is load-bearing.** The engine reads `generated/world.json` and paints; all richness lives in spine files that both humans and agents can author against Zod schemas.

## What's being deleted in this pivot

- `src/game/procgen/` (all of it)
- `src/game/solid-ui/NewGameModal.tsx`
- Seed HUD chip in `AdventureHUD.tsx`
- `src/content/village.json`
- The hungry-friend quest (reframed as the starter-choose ceremony on jan Sewi's side)
