---
title: Sprite Curation Reference
updated: 2026-04-22
status: current
domain: technical
---

# Sprite Sheet Curation — The Process

Every sprite sheet under `public/assets/{animals,creatures,bosses,combatants,npcs,effects}/` is hand-curated: **one human looks at one sheet and decides what each row means.** No scripting, no batch automation, no auto-grid-detection. Those miss details.

This doc is the authoritative reference for how curation is done. It walks through one fully-curated species (`mudgrub` — the rat) and shows exactly what to produce for each sheet.

Current runtime split: catchable creature sprites still live with authored species records under `src/content/spine/species/*.json`, while player/NPC/combatant/boss/effect registration data lives in validated gameplay JSON under `src/content/gameplay/visuals.json` and `src/content/gameplay/effects.json`. The curation process is the same; only the destination file differs by asset category.

## The rule

**You decide intent.** When you look at a row of animation frames, you commit to what the animation IS — idle, walk, attack, taunt, flee, hurt, death. You don't hedge, you don't default to "idle-only when uncertain," you don't say "probably walk." You look, you decide, you write it down. This is the whole job.

## Worked reference — `mudgrub` (rat)

### Step 1 — Probe the sheet

```bash
node -e "const { imageSize } = require('image-size'); const fs=require('fs'); \
  const r=imageSize(fs.readFileSync('public/assets/animals/rat.png')); \
  console.log(r.width+'x'+r.height);"
# → 160x256
```

### Step 2 — Deduce frame dimensions

The sheet is a clean pixel-art grid. Find integer divisors of both axes that produce a sensible frame size (16–128 px per side):

- 160 ÷ 5 = 32 (5 columns)
- 256 ÷ 8 = 32 (8 rows)

**Frame = 32×32. Grid = 5 cols × 8 rows = 40 cells.**

### Step 3 — Read each row visually

Open the PNG, look at each row, decide what the animation is. Commit.

For `rat.png`:

| Row | Frames | What the sprite shows | Animation name | fps | loop |
|---|---|---|---|---|---|
| 0 | 5 | Rat standing + sniffing, slight head tilt | `idle` | 4 | yes |
| 1 | 5 | Rat in scamper pose, legs spread | `walk` | 10 | yes |
| 2 | 5 | Rat crouched low, tail flicking | `sneak` | 6 | yes |
| 3 | 5 | Rat lunging forward, teeth out | `attack` | 12 | no |
| 4 | 5 | Rat mid-scurry, darker tone | `flee` | 12 | yes |
| 5 | 5 | Rat flattened in aggressive posture | `taunt` | 8 | no |
| 6 | 4 | Rat curled small | `hurt` | 8 | no |
| 7 | 5 | Rat lying limp progressively | `death` | 6 | no |

### Step 4 — Write the `sprite` block

```json
"sprite": {
  "src": "/assets/animals/rat.png",
  "frame_width": 32,
  "frame_height": 32,
  "animations": {
    "idle":   { "row": 0, "col_start": 0, "cols": 5, "fps": 4,  "loop": true  },
    "walk":   { "row": 1, "col_start": 0, "cols": 5, "fps": 10, "loop": true  },
    "sneak":  { "row": 2, "col_start": 0, "cols": 5, "fps": 6,  "loop": true  },
    "attack": { "row": 3, "col_start": 0, "cols": 5, "fps": 12, "loop": false },
    "flee":   { "row": 4, "col_start": 0, "cols": 5, "fps": 12, "loop": true  },
    "taunt":  { "row": 5, "col_start": 0, "cols": 5, "fps": 8,  "loop": false },
    "hurt":   { "row": 6, "col_start": 0, "cols": 4, "fps": 8,  "loop": false },
    "death":  { "row": 7, "col_start": 0, "cols": 5, "fps": 6,  "loop": false }
  },
  "tier": "common"
}
```

See `src/content/spine/species/mudgrub.json` for the full species file with stats + learnset + descriptor.

## Naming conventions

### Core animation names (use these whenever possible)

| Name | When it fires | Typical fps | Loop? |
|---|---|---|---|
| `idle` | Default standing pose | 3–6 | yes |
| `walk` | Moving across the map | 8–12 | yes |
| `attack` | Striking / lunging / swinging | 10–14 | no |
| `cast` | Ranged or magical attack | 8–12 | no |
| `hurt` | Taking damage | 8 | no |
| `death` | HP → 0 | 5–8 | no |

### Extended names (use when a sheet has extra rows)

- `walk_up` / `walk_down` / `walk_left` / `walk_right` — 4-dir packs
- `idle_alt` — secondary idle variant (breathing, yawning)
- `sneak` — crouched movement
- `flee` — running away in combat
- `taunt` — intimidation pose before attack
- `defend` — blocking stance
- `fly` / `hover` / `launch` — airborne creatures (green-dragon uses all three)
- `special` — unique signature move (fire-skull fireball, slime split, etc.)

### What NOT to do

- ❌ Don't invent whimsical names like `doing_the_thing` or `grr`. Pick a core name that matches intent.
- ❌ Don't use `animation_1`, `row_3`, or other index-based names — those defeat the whole point.
- ❌ Don't skip a row because "it's probably the same as idle." Look. Decide.

## FPS + loop guidelines

- **Loops (`loop: true`)** — idle, walk, sneak, fly, hover, flee. Anything that plays continuously.
- **One-shots (`loop: false`)** — attack, cast, hurt, death, taunt. The engine holds the last frame or returns to idle when the strip finishes.
- **fps ranges:**
  - Slow + deliberate: idle 3–6, sneak 6
  - Natural motion: walk 8–10, hover 6
  - Energetic: attack 10–12, flee 10–12
  - Snappy: fireball/projectile 14–20

## Tier assignment

The `tier` field hints at spawn behavior:

| Tier | Examples | Catch rate range | XP range | Grid placement |
|---|---|---|---|---|
| `common` | rat, goblin, zombie, hedgehog | 0.35–0.48 | 40–70 | any tall-grass |
| `uncommon` | wolf, vulture, orc, skelly-warrior | 0.22–0.34 | 70–120 | late-region grass only |
| `legendary` | green-dragon, giant-gorilla, crocodile | 0.05–0.12 | 200–300 | set-piece + rare roll |

## The curation workflow (per sprite sheet)

1. `Read` the PNG in the IDE to view it.
2. Probe dimensions with `image-size`.
3. Deduce frame size from clean divisors.
4. Walk each row top-to-bottom. For each row, write one sentence: "Row N — X frames — what I see." Then name it.
5. Write the JSON block following the rat template above.
6. Run `pnpm validate && pnpm build-spine` to verify.
7. Commit one species per commit; trivial doc note is fine in the body.

## Agent dispatch pattern

When dispatching a sub-agent per asset category (animals, creatures, bosses, combatants, npcs, effects), include:

- Pointer to this doc as the authoritative reference.
- List of files in the agent's category.
- Hard rule: one species per commit, all pushed to the working branch.
- Forbidden: batch-writing JSON from a loop/script, assuming frame dims match a prior sheet, inventing animation names not in the core+extended lists above.

The agent is expected to produce one commit per sprite sheet, with the curation choices laid out in the commit body (row-by-row read).
