---
title: Agent Brief — Region Team
updated: 2026-04-22
status: historical
domain: ops
---

# Region team agent brief

Historical note: this brief predates the RPG.js v5 pivot. Region content no longer lives under `src/content/spine/regions/`, and the current repo does not use Phaser scenes. For current work, author the map in `scripts/map-authoring/specs/<region_id>.ts` and any supporting dialog under `src/content/spine/dialog/`.

## Worktree prologue

```bash
BRANCH="content/region-<region-id>"
WT_PATH=".worktrees/${BRANCH}"
cd /Users/jbogaty/src/arcade-cabinet/toki-pona-tutor
if [[ "$(git rev-parse --show-toplevel)" == "$(pwd)" && ! "$(pwd)" == *"/.worktrees/"* ]]; then
  git fetch origin main
  git worktree add -B "$BRANCH" "$WT_PATH" origin/main
  cd "$WT_PATH" || exit 1
fi
pnpm install --ignore-workspace
```

## What to author

Your brief specifies **one region** by id — e.g. `ma_telo` (the lake village), `nena_sewi` (the mountain pass). Author the map spec plus any dialog nodes its NPCs need.

### Required content

- Grid dimensions: villages are ~20×14, routes are long (~32×10), mountain passes are ~16×20. Your brief will specify.
- Sky color: villages `#8bc260` (kenney town green), routes same, mountains `#6b7a83` (stone), lakes `#5ba7d8` (blue).
- At least **2 tile layers** (`ground`, `objects`). A third `overlay` layer is optional (flowers, shimmer).
- **At least 5 NPCs**, each with a distinct role — one quest-giver / jan-lawa where the region has one, multiple ambient villagers, optionally a shopkeeper or rival.
- **2–3 signs** with canonical-TP text.
- **1–2 warps** to adjacent regions.
- **Tall grass:** if this region has encounters, 30–60% of walkable ground should be tall-grass keys.
- **Encounters:** 3–6 species in a weighted table. Weights are relative integers, not probabilities that must sum to 1.0. Species must already exist in `src/content/spine/species/`.
- **Dialog spine:** at least 1 dialog node per NPC under `src/content/spine/dialog/`. Quest-giver NPCs get multi-beat dialog (3–5 beats); ambient NPCs now use at least two beats so the T4-15 floor remains meaningful.
- **Spawn point:** where the player lands when warping in.

### Writing canonical TP

Every multi-word `{ en }` field — `description`, sign text, dialog beats — will be validated against `src/content/corpus/tatoeba.json` at build time. Single-word TP (names, sign text like `"ma"`) is exempt.

**Read `docs/WRITING_RULES.md` before writing any line.** The validator now scores every line against those rules (hard + soft) *before* checking corpus membership — lines that violate the rules fail the build with a complexity breakdown (rare words, uncommon starter, subordinate clauses, length). The ceiling is rank ≤ 40; stay well under.

Process:
1. Read `docs/WRITING_RULES.md`. Internalize: ≤ 9 words, single clause, `.`/`?`/`!`, top-1000 vocabulary, starters like `I/You/Tom/The/We/This`.
2. Write the English beat following the rules.
3. Run `pnpm validate-tp`. If it flags complexity, the message names the offending axis (e.g. `rare words: mountains, climb; compound clause`). Rewrite to fix the axis.
4. If the line passes complexity but misses the corpus, use one of the suggested Tatoeba pairs verbatim. Canonical > authored.
5. When in doubt, `grep -i "YOUR IDEA" src/content/corpus/tatoeba.json | head -5` and pick from what already exists.

**Short English works.** Three-to-six-word sentences are your friend. "Water is good." / "telo li pona." will pass. "My wise friend sits by the ancient well and sings" will never find a pair.

### Tile keys

Tile keys in `layers[].tiles` are short strings the engine maps to frames at runtime. Use:

- `"g"` — grass
- `"gf"` — grass with flowers
- `"gd"` — grass detail (small weeds)
- `"stone"` — stone floor (plaza)
- `"tree_g"`, `"tree_y"` — full-canopy trees (solid)
- `"bush"` — bushes (solid)
- `"house_b"`, `"house_r"` — house icons (solid)
- `"sign"` — signpost (solid)
- `"mushroom"` — kili patch
- `"grass_tall"` — tall grass tile (goes in `tall_grass_keys`)

Add new keys if your region needs them; encode them in the relevant `scripts/map-authoring/palettes/*.ts` file so the emitter and renderer can resolve them.

### Warps

A warp moves the player to another region when they step on a specific tile. Place warps on the EDGE of the map, at walkable tiles:

```json
{
  "id": "east_exit",
  "tile": { "x": 19, "y": 7 },
  "to_region": "nasin_wan",
  "to_tile": { "x": 1, "y": 5 }
}
```

## Validate loop

```bash
pnpm validate-tp
node scripts/build-spine.mjs
pnpm typecheck
```

All three must be green.

## PR

```bash
git add -A
git commit -m "feat(content): region <id> — <short descriptor>"
git push -u origin "$BRANCH"
gh pr create --title "..." --body "..."
```

## Stall + self-review + merge

See `docs/AGENT_TEAMS.md`.

## Guardrails

- Only edit inside your worktree
- Keep region content in `scripts/map-authoring/specs/<region_id>.ts` plus supporting `src/content/spine/dialog/*.json`; do not revive `src/content/spine/regions/`
- Never hand-author TP; always let the pipeline resolve it
- Always squash-merge, never force-push, never skip hooks
