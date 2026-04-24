---
title: NPC Sprite Manifest
updated: 2026-04-22
status: current
domain: technical
---

# NPC Sprite Manifest

All sprite sheets under `public/assets/npcs/` are documented here. Each sheet is
hand-inspected — frame dimensions, animation strips, and canonical IDs are recorded
below. Combat variants (`*-combat.png`) are documented for completeness but are not
wired to ambient NPCs; they are reserved for future cutscene or combat-event use.

Current runtime status: canonical NPC sprite IDs and image paths live in
`src/content/gameplay/visuals.json`, are validated by
`src/content/gameplay/schema.ts`, exported as `NPC_SPRITESHEET_CONFIGS`, and
registered into RPG.js by `src/config/npc-sprites.ts`. Event/shop/starter JSON
selects the graphic ID, and the runtime factories apply it with `setGraphic()`.

## Ground rules

- Non-combat sheets drive ambient NPC appearance via JSON-selected graphic IDs and `setGraphic()`.
- NPC combat sheets are catalogued but not yet consumed by ambient events.
- Animation names: `idle`, `walk` are mandatory. Guards may also have `watch`
  (stationary eyes-scanning pose) and `patrol` (slow walk variant).
- No combat animations (`attack`, `hurt`, `death`) are wired for ambient NPCs.
- Canonical IDs follow `npc_<class>_<variant>` convention.

---

## Guards (`public/assets/npcs/guards/`)

All guard non-combat sheets share dimensions **64 × 496**, frame size **16 × 16**,
grid **4 cols × 31 rows**. Row layout (4-dir, 3 frames per direction block):

| Rows  | Direction   | Animation |
|-------|-------------|-----------|
| 0–2   | Down        | `walk` (row 1 is stand frame) |
| 3–5   | Left        | `walk` |
| 6–8   | Right       | `walk` |
| 9–11  | Up          | `walk` |
| 12–23 | All 4 dirs  | `patrol` (alternate walk — slightly faster stride) |
| 24    | Down        | `watch` (eyes-scanning idle, single frame) |
| 25–27 | Left/Right/Up | `watch` supplementary directions |
| 28–30 | —           | rest / collapse (not wired for ambient) |

Guard combat sheets are **128 × 256** (archer) or **128 × 384** (spearman,
swordsman), frame size **32 × 32**, grid **4 cols × 8 or 12 rows**.

### `npc_guard_spear` — `guard-spearman.png`

```
src:          /assets/npcs/guards/guard-spearman.png
frame_width:  16
frame_height: 16
animations:
  idle:    { row: 1,  col_start: 1, cols: 1, fps: 2, loop: true  }   # single stand frame, down
  walk:    { row: 0,  col_start: 0, cols: 3, fps: 8, loop: true  }   # walk down (start row)
  watch:   { row: 24, col_start: 0, cols: 4, fps: 3, loop: true  }   # eyes-scan row
  patrol:  { row: 12, col_start: 0, cols: 3, fps: 6, loop: true  }   # alternate stride down
```

Row-by-row read (non-combat sheet, selected rows):
- Row 0 — 4 frames — spearman stepping downward, spear at side — `walk` (down)
- Row 1 — 4 frames — stationary facing down, shield held — `idle` (down stand)
- Rows 0–11: four-directional walk cycle, 3 motion frames + 1 stand each
- Rows 12–23: same four directions but exaggerated march stride — `patrol`
- Row 24: guard scanning left-right, body still — `watch`

Combat sheet (`guard-spearman-combat.png`, 128 × 384, 32 × 32, 4 cols × 12 rows):
| Rows  | Animation  |
|-------|------------|
| 0–2   | lunge down  |
| 3–5   | lunge left  |
| 6–8   | lunge right |
| 9–11  | lunge up    |

---

### `npc_guard_archer` — `guard-archer-non-combat.png`

```
src:          /assets/npcs/guards/guard-archer-non-combat.png
frame_width:  16
frame_height: 16
animations:
  idle:    { row: 1,  col_start: 1, cols: 1, fps: 2, loop: true  }
  walk:    { row: 0,  col_start: 0, cols: 3, fps: 8, loop: true  }
  watch:   { row: 24, col_start: 0, cols: 4, fps: 3, loop: true  }
  patrol:  { row: 12, col_start: 0, cols: 3, fps: 6, loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — archer walking down, bow at back — `walk` (down)
- Row 1 — 4 frames — archer standing, quiver visible — `idle` (down)
- Rows 0–11: full 4-dir walk cycle
- Rows 12–23: march/patrol variant — `patrol`
- Row 24: archer scanning with hand shading eyes — `watch`

Combat sheet (`guard-archer-combat.png`, 128 × 256, 32 × 32, 4 cols × 8 rows):
| Rows  | Animation |
|-------|-----------|
| 0–1   | draw + release down |
| 2–3   | draw + release left |
| 4–5   | draw + release right |
| 6–7   | draw + release up |

---

### `npc_guard_sword` — `guard-swordsman.png`

```
src:          /assets/npcs/guards/guard-swordsman.png
frame_width:  16
frame_height: 16
animations:
  idle:    { row: 1,  col_start: 1, cols: 1, fps: 2, loop: true  }
  walk:    { row: 0,  col_start: 0, cols: 3, fps: 8, loop: true  }
  watch:   { row: 24, col_start: 0, cols: 4, fps: 3, loop: true  }
  patrol:  { row: 12, col_start: 0, cols: 3, fps: 6, loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — swordsman striding down, sword sheathed — `walk` (down)
- Row 1 — 4 frames — standing at attention, helmet visible — `idle` (down)
- Rows 0–11: 4-dir walk cycle
- Rows 12–23: patrol stride — `patrol`
- Row 24: head turning left-right scan — `watch`

Combat sheet (`guard-swordsman-combat.png`, 128 × 384, 32 × 32, 4 cols × 12 rows):
| Rows  | Animation   |
|-------|-------------|
| 0–2   | slash down  |
| 3–5   | slash left  |
| 6–8   | slash right |
| 9–11  | slash up    |

---

## Villagers — Feminine (`public/assets/npcs/villagers-fem/`)

All feminine villager non-combat sheets: **64 × 496**, frame **16 × 16**, grid
**4 cols × 31 rows**.

Row layout is identical across all 7 villagers:

| Rows  | Animation content |
|-------|-------------------|
| 0–2   | walk down         |
| 3–5   | walk left         |
| 6–8   | walk right        |
| 9–11  | walk up           |
| 12–23 | run/hurry cycle (4 dirs, 3 frames each) |
| 24    | seated idle (single row, 4 frames facing down) |
| 25–26 | alternate seated / crouched |
| 27–28 | hurt / stumble |
| 29–30 | lying / collapsed |

For ambient NPC use, only `idle` (row 1 stand frame) and `walk` (rows 0–11
directional) are registered. The run and collapse rows are documented but unused
by ambient events.

Combat sheets are **64 × 320**, frame **16 × 16**, grid **4 cols × 20 rows** and
contain attack and hurt strips not wired for ambient NPCs.

---

### `npc_villager_fem_hana` — `villagers-fem/hana/hana.png`

Warm-toned outfit, brown hair with ponytail. Lighter palette — suitable for
sunny village or market roles.

```
src:          /assets/npcs/villagers-fem/hana/hana.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — stepping downward, warm clothes, hair bouncing — `walk` (down)
- Row 1 — 4 frames — standing still facing viewer — `idle` (down)
- Rows 0–11: full 4-dir walk

---

### `npc_villager_fem_julz` — `villagers-fem/julz/julz.png`

Blue-toned traveller's outfit. Distinct scarf visible. Suitable for inn or
travel-related NPC roles.

```
src:          /assets/npcs/villagers-fem/julz/julz.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — walking down, blue scarf trailing — `walk` (down)
- Row 1 — 4 frames — standing, hands at sides — `idle` (down)

---

### `npc_villager_fem_khali` — `villagers-fem/khali/khali.png`

Dark colours with teal/green accents, darker skin tone. Distinguished look —
suits elder or important NPC roles.

```
src:          /assets/npcs/villagers-fem/khali/khali.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — deliberate downward step, layered robes — `walk` (down)
- Row 1 — 4 frames — dignified stand — `idle` (down)

---

### `npc_villager_fem_meza` — `villagers-fem/meza/meza.png`

Dark palette with amber/yellow trim. Top hat silhouette visible. Eccentric
merchant or wise-woman character feel.

```
src:          /assets/npcs/villagers-fem/meza/meza.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — stepping down, hat bobbing, layered skirt — `walk` (down)
- Row 1 — 4 frames — standing, hat prominent — `idle` (down)

---

### `npc_villager_fem_nel` — `villagers-fem/nel/nel.png`

Purple/red tones, long dress, older character silhouette. Good elder or
storyteller figure.

```
src:          /assets/npcs/villagers-fem/nel/nel.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — walking down, flowing purple dress — `walk` (down)
- Row 1 — 4 frames — standing, robes settled — `idle` (down)

---

### `npc_villager_fem_seza` — `villagers-fem/seza/seza.png`

Golden/yellow outfit with white apron detail. Clear cook/baker or shopkeeper
look.

```
src:          /assets/npcs/villagers-fem/seza/seza.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — stepping down, apron, basket or tray visible — `walk` (down)
- Row 1 — 4 frames — standing, hands folded — `idle` (down)

---

### `npc_villager_fem_vash` — `villagers-fem/vash/vash.png`

Orange/red tones, practical clothing, shorter stature. Active outdoors type —
suits fisher or gardener roles.

```
src:          /assets/npcs/villagers-fem/vash/vash.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — walking down, practical gear, energetic stride — `walk` (down)
- Row 1 — 4 frames — standing with tool or item in hand — `idle` (down)

---

## Villagers — Masculine (`public/assets/npcs/villagers-masc/`)

Same dimensions as fem: **64 × 496**, frame **16 × 16**, grid **4 cols × 31 rows**.
Row layout identical.

---

### `npc_villager_masc_artun` — `villagers-masc/artun/artun.png`

Light outfit, blond/light hair, youthful proportions. Clean-cut young villager
suitable for general ambient roles.

```
src:          /assets/npcs/villagers-masc/artun/artun.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — walking down, light-coloured outfit, casual stride — `walk`
- Row 1 — 4 frames — standing, arms relaxed — `idle`

---

### `npc_villager_masc_grym` — `villagers-masc/grym/grym.png`

Dark earth tones, heavier frame, weathered look. Older villager; suits watchman
or laborer.

```
src:          /assets/npcs/villagers-masc/grym/grym.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — deliberate step, heavy gear — `walk` (down)
- Row 1 — 4 frames — stoic stand — `idle` (down)

---

### `npc_villager_masc_hark` — `villagers-masc/hark/hark.png`

Green and brown tones, hooded look. Ranger or outdoor traveller feel.

```
src:          /assets/npcs/villagers-masc/hark/hark.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — walking down, hood up, pack on back — `walk` (down)
- Row 1 — 4 frames — standing, arms crossed or resting — `idle` (down)

---

### `npc_villager_masc_janik` — `villagers-masc/janik/janik.png`

Purple/grey tunic with belt detail, darker skin. Artisan or elder look with
distinguished silhouette.

```
src:          /assets/npcs/villagers-masc/janik/janik.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — measured walk downward, layered tunic — `walk` (down)
- Row 1 — 4 frames — upright stand, confident posture — `idle` (down)

---

### `npc_villager_masc_nyro` — `villagers-masc/nyro/nyro.png`

Dark blue/purple robes, slight scholar or mystic look. Good fit for a
meditation-related or philosophical NPC.

```
src:          /assets/npcs/villagers-masc/nyro/nyro.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — slow, deliberate downward walk, robes sweeping — `walk`
- Row 1 — 4 frames — hands-in-sleeves stand — `idle`

---

### `npc_villager_masc_reza` — `villagers-masc/reza/reza.png`

Red-brown tones with green trim, taller silhouette. Active traveller or route
companion look.

```
src:          /assets/npcs/villagers-masc/reza/reza.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — energetic step downward, belt and satchel — `walk` (down)
- Row 1 — 4 frames — standing, hand on hip — `idle` (down)

---

### `npc_villager_masc_serek` — `villagers-masc/serek/serek.png`

Orange-yellow outfit with darker accents. Compact, sturdy build. Good market
vendor or general townsfolk.

```
src:          /assets/npcs/villagers-masc/serek/serek.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — walking down, bright outfit, relaxed arms — `walk` (down)
- Row 1 — 4 frames — standing, smiling posture implied — `idle` (down)

---

## Warriors (`public/assets/npcs/warriors/`)

Non-combat sheets: **64 × 496**, frame **16 × 16**, grid **4 cols × 31 rows** —
same structure as villagers. Warriors have a heavier build and weapon/armour
details.

Combat sheets: **128 × 256** (archer), **128 × 384** (2h swordsman),
**128 × 640** (sword-and-shield), frame **32 × 32**.

---

### `npc_warrior_archer` — `warriors/archer-non-combat.png`

Dark outfit, quiver on back, ranger posture. Lighter warrior — used for seasoned
trackers or veteran scouts.

```
src:          /assets/npcs/warriors/archer-non-combat.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — purposeful walk, bow at back, quiver bouncing — `walk`
- Row 1 — 4 frames — alert stance, hand near bow — `idle`
- Rows 12–23: patrol stride — heavier, scanning gait

Combat sheet (`archer-combat.png`, 128 × 256, 32 × 32, 4 cols × 8 rows):
| Rows | Animation |
|------|-----------|
| 0–1  | draw + loose down |
| 2–3  | draw + loose left |
| 4–5  | draw + loose right |
| 6–7  | draw + loose up |

---

### `npc_warrior_2h_sword` — `warriors/2-handed-swordsman-non-combat.png`

Grey-plate armour, large sword on back. The heaviest foot soldier — veteran
look. Suits an experienced route-blocker or veteran fisher (grizzled).

```
src:          /assets/npcs/warriors/2-handed-swordsman-non-combat.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — heavy tread downward, greatsword visible at back — `walk`
- Row 1 — 4 frames — wide-stance stand, arms at sides — `idle`

Combat sheet (`2-handed-swordsman-combat.png`, 128 × 384, 32 × 32, 4 cols × 12 rows):
| Rows  | Animation   |
|-------|-------------|
| 0–2   | overhead swing down  |
| 3–5   | overhead swing left  |
| 6–8   | overhead swing right |
| 9–11  | overhead swing up    |

---

### `npc_warrior_sword_shield` — `warriors/sword-and-shield-fighter-non-combat.png`

Light-silver armour with round shield, sword at hip. Balanced fighter — good
default for a veteran NPC who is neither the biggest nor lightest warrior.

```
src:          /assets/npcs/warriors/sword-and-shield-fighter-non-combat.png
frame_width:  16
frame_height: 16
animations:
  idle:  { row: 1,  col_start: 1, cols: 1, fps: 2,  loop: true  }
  walk:  { row: 0,  col_start: 0, cols: 3, fps: 8,  loop: true  }
```

Row-by-row read:
- Row 0 — 4 frames — measured step, shield arm out slightly — `walk` (down)
- Row 1 — 4 frames — shield-ready stance — `idle` (down)

Combat sheet (`sword-and-shield-fighter-combat.png`, 128 × 640, 32 × 32, 4 cols × 20 rows):
| Rows  | Animation         |
|-------|-------------------|
| 0–4   | thrust + shield down |
| 5–9   | thrust + shield left |
| 10–14 | thrust + shield right |
| 15–19 | thrust + shield up |

---

## NPC-to-sprite assignment

| NPC id           | Map            | Canonical sprite ID              | Rationale |
|------------------|----------------|----------------------------------|-----------|
| `selby`       | riverside_home   | `npc_villager_fem_nel`           | Elder/distinguished elder; nel's purple robes read as wise authority |
| `piper`  | riverside_home   | `npc_villager_fem_nel`           | Welcoming home-village villager; reuses the soft elder silhouette |
| `wren`  | riverside_home   | `npc_villager_masc_reza`         | Water-well villager; reza's traveler palette reads calm and quiet |
| `oren`  | riverside_home   | `npc_villager_masc_artun`        | Starter-supplies villager; artun's youthful look fits readiness |
| `fig`  | riverside_home   | `npc_villager_fem_hana`          | Food/healing villager; hana's warm casual look suits starter-town flavor |
| `briar` | greenwood_road    | `npc_villager_masc_janik`        | Route-marker walker; janik's artisan silhouette reads as a sign minder |
| `thorn` | greenwood_road      | `npc_villager_fem_vash`          | Grass-route villager; vash's outdoor gear fits forest edge flavor |
| `pack` | greenwood_road      | `npc_villager_masc_artun`        | Route-supplies walker; artun gives the first-route pack a friendly face |
| `lark` | greenwood_road     | `npc_villager_masc_hark`         | Watcher near the rival route; hark's hooded ranger look fits patrol flavor |
| `boulder`      | highridge_pass      | `npc_villager_masc_grym`         | Mountain rock villager; grym's heavy look fits highland stone |
| `angler`       | highridge_pass      | `npc_villager_masc_hark`         | Hiker on mountain pass; hark's hooded ranger look matches well |
| `kestrel`  | highridge_pass      | `npc_villager_fem_hana`          | High-bird watcher; hana keeps the mountain pass from feeling all-guard |
| `marsha` | highridge_pass      | `npc_villager_masc_janik`        | Path guide before the first gym; janik reads as a local route expert |
| `loren`  | lakehaven        | `npc_villager_fem_vash`          | Lake fisher; vash's practical outdoor gear suits a shore-side angler |
| `shopkeep`       | lakehaven        | `npc_villager_fem_seza`          | Food-stall cook; seza's apron/vendor look is a direct match |
| `myra`  | lakehaven        | `npc_villager_masc_reza`         | Quiet lake-lover; reza's traveller look for a riverside contemplator |
| `tarn`  | lakehaven        | `npc_villager_fem_nel`           | Plaza villager; nel's rounded robe shape matches the central-town role |
| `corvin`       | frostvale        | `npc_villager_masc_grym`         | Watchman in cold village; grym's heavy weathered look fits cold-region |
| `luma`  | frostvale        | `npc_villager_fem_hana`          | Cold-light villager; hana adds warmth against the snow palette |
| `brindle`  | frostvale        | `npc_villager_masc_artun`        | Cold-route supply checker; artun fits a small pack/readiness role |
| `hollis`       | frostvale        | `npc_villager_fem_vash`          | Garden-tender; vash's practical outdoors gear |
| `graym` | dreadpeak_cavern      | `npc_villager_masc_grym`         | Cave-stone villager; grym's heavy silhouette fits rock-wall flavor |
| `meadow`     | dreadpeak_cavern      | `npc_villager_masc_nyro`         | Meditating figure on great peak; nyro's mystic robes fit perfectly |
| `ember` | dreadpeak_cavern     | `npc_villager_fem_seza`          | Torch-side cave villager; seza's apron shape reads clearly in low light |
| `rowan`   | dreadpeak_cavern      | `npc_villager_masc_janik`        | Trail-asking NPC; janik's distinguished artisan look |
| `lily`  | rivergate_approach  | `npc_villager_fem_hana`          | Lighter-duty young fisher; hana's warm casual look |
| `grill`  | rivergate_approach  | `npc_villager_masc_artun`        | Grillmaster; artun's youthful energetic look for a roadside cook |
| `cormorant`  | rivergate_approach  | `npc_warrior_2h_sword`           | Veteran fisher — "suli" = big/veteran; heaviest warrior sprite |
| `myra`  | rivergate_approach  | `npc_villager_masc_reza`         | Quiet lake-lover; reza's traveller look for a riverside contemplator |
| `sola`  | rivergate_approach  | `npc_villager_fem_hana`          | Final riverbank villager; hana keeps the end route warm before the boss |

### Unbound NPCs (in server.ts but not ambient — excluded from this manifest)

| NPC id    | Reason excluded |
|-----------|-----------------|
| `selby` | Wired through `JanSewi()` event factory (not `AmbientNpc`); uses `'female'` graphic — overridden in this work to `npc_villager_fem_nel` |
| `rook`  | Rival combatant — handled by `JanIke()` factory; out of scope for NPC sprite curation |
| `tarrin`, `marin`, `frost`, `cliff` | Gym leaders — handled by `GymLeader()` factory; out of scope |
