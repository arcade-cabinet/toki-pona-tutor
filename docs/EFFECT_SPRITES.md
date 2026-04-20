---
title: Effect Sprites Manifest
updated: 2026-04-19
status: current
domain: technical
---

# Effect Sprites Manifest

Every VFX sprite sheet under `public/assets/effects/` is documented here. Each entry records the source PNG, frame dimensions, named animation strips, and the suggested move-binding for the engine wiring pass.

**Hard rules carried from `SPRITE_CURATION.md`:**
- Frame dimensions are hand-determined from visual inspection + clean-divisor math — never auto-detected.
- Animation names for effects: one-shots use `play`; named events use the event name (e.g. `fireball_travel`, `slash_horizontal`).
- Effects don't loop (`loop: false`) unless they are ambient particles that sustain continuously.
- Do NOT modify `moves/*.json` vfx fields yet — see "Move Binding" column for recommendations only.

---

## Root effects

### `feather.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/feather.png` |
| Dimensions | 64 × 16 px |
| Frame size | 16 × 16 px |
| Grid | 4 cols × 1 row |
| Total frames | 4 |

**Strip read:**

| Strip | Row | Cols | What I see | fps | loop |
|---|---|---|---|---|---|
| `play` | 0 | 0–3 | Single dark feather silhouette rotating/tumbling — drifting projectile | 14 | no |

**Suggested spritesheet id:** `fx_feather_drift`

**Move-vfx binding (recommend, not yet wired):**
- `wawa_waso` (flit — bird aerial attack) → `fx_feather_drift`

---

### `gas.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/gas.png` |
| Dimensions | 64 × 224 px |
| Frame size | 64 × 32 px |
| Grid | 1 col × 7 rows |
| Total frames | 7 |

**Strip read:**

| Strip | Row | What I see | fps | loop |
|---|---|---|---|---|
| `play` | 0–6 | Green gas cloud: dense blob condensing, then puffing outward in stages, dissipating to a wisp — single-column 7-frame one-shot | 8 | no |

**Suggested spritesheet id:** `fx_gas_cloud`

**Move-vfx binding (recommend, not yet wired):**
- `kon_wawa` (windblast — gas/wind move) → `fx_gas_cloud`

---

### `dirt.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/dirt.png` |
| Dimensions | 96 × 32 px |
| Frame size | 32 × 32 px |
| Grid | 3 cols × 1 row |
| Total frames | 3 |

**Strip read:**

| Strip | Row | What I see | fps | loop |
|---|---|---|---|---|
| `play` | 0 | Three frames of a brown dirt clod arcing/scattering leftward — brief kick-up one-shot | 12 | no |

**Suggested spritesheet id:** `fx_dirt_kickup`

**Move-vfx binding (recommend, not yet wired):**
- `kiwen_wawa` (stoneblow — ground-pound move) → `fx_dirt_kickup`
- `utala` (fight — physical strike, ground tier) → `fx_dirt_kickup` (fallback)

---

## `magical/` effects

### `elemental-spellcasting-effects-v1-anti-alias-glow-8x8.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/elemental-spellcasting-effects-v1-anti-alias-glow-8x8.png` |
| Dimensions | 32 × 208 px |
| Frame size | 8 × 8 px |
| Grid | 4 cols × 26 rows |
| Total frames | 104 (26 strips of 4) |

**Strip read (selected rows, top-to-bottom):**

| Row | What I see | Assigned strip name |
|---|---|---|
| 0 | Blue water-drop orbs flickering/glowing | `water_orb` |
| 1 | Pink/magenta orbs pulsing | `pink_orb` |
| 2 | Orange fire orbs expanding | `fire_orb` |
| 3 | Wind/air swirl shapes rotating | `wind_swirl` |
| 4 | White/grey cloud wisps | `cloud_wisp` |
| 5 | Ice/pale-blue crystal shards | `ice_shard` |
| 6 | Green leaf/poison orbs | `poison_orb` |
| 7–25 | Remaining elemental variants (dark, earth, thunder, heart/cure, shadow, holy) | named `row_N` in extended config if needed |

**Primary registration:** row 0–6 as named animations; remaining rows available for extension.

**Suggested spritesheet id:** `fx_spell_orbs_v1`

**Move-vfx binding (recommend, not yet wired):**
- `telo_lili` (splash) → `fx_spell_orbs_v1` animation `water_orb`
- `seli_lili` (ember) → `fx_spell_orbs_v1` animation `fire_orb`
- `lete_lili` (chill) → `fx_spell_orbs_v1` animation `ice_shard`
- `kasi_lili` (leaf) → `fx_spell_orbs_v1` animation `poison_orb`

---

### `elemental-spellcasting-effects-v2-8x8.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/elemental-spellcasting-effects-v2-8x8.png` |
| Dimensions | 32 × 208 px |
| Frame size | 8 × 8 px |
| Grid | 4 cols × 26 rows |
| Total frames | 104 |

**Strip read:**

Same row-type structure as v1 — this is a stylistic variant (v2) of the same elemental orb set, with slightly different color tones. V2 used for stronger-tier moves (wawa suffix moves).

**Suggested spritesheet id:** `fx_spell_orbs_v2`

**Move-vfx binding (recommend, not yet wired):**
- `telo_wawa` (wave) → `fx_spell_orbs_v2` animation `water_orb`
- `seli_wawa` (blaze) → `fx_spell_orbs_v2` animation `fire_orb`
- `lete_wawa` (freeze) → `fx_spell_orbs_v2` animation `ice_shard`
- `kasi_wawa` (bloom) → `fx_spell_orbs_v2` animation `poison_orb`

---

### `extra-elemental-spellcasting-effects-14x14.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/extra-elemental-spellcasting-effects-14x14.png` |
| Dimensions | 56 × 126 px |
| Frame size | 14 × 14 px |
| Grid | 4 cols × 9 rows |
| Total frames | 36 |

**Strip read:**

| Row | What I see | Assigned strip name |
|---|---|---|
| 0 | Orange/gold flame orb expanding — brightening then fading | `fire_burst` |
| 1 | Dark/charcoal smoky orb collapsing | `dark_burst` |
| 2 | Blue-grey impact splash | `water_burst` |
| 3 | Purple/violet orb flickering | `shadow_burst` |
| 4 | Teal/green toxic orb | `poison_burst` |
| 5 | White flash — heal/cure pulse | `cure_burst` |
| 6 | Red ember orb | `ember_burst` |
| 7 | Ice-blue shard explosion | `ice_burst` |
| 8 | Grey rock impact | `earth_burst` |

**Suggested spritesheet id:** `fx_spell_bursts_14`

**Note:** The anti-alias-glow variant (`extra-elemental-spellcasting-effects-anti-alias-glow-14x14.png`) is identical in layout — same frame dimensions and grid. It is registered separately as `fx_spell_bursts_14_glow` for use when a softer, glow-blended look is preferred (e.g. boss move hits).

**Move-vfx binding (recommend, not yet wired):**
- `seli_wawa` (blaze — strong fire) → `fx_spell_bursts_14` animation `fire_burst`
- `lete_suli` (blizzard) → `fx_spell_bursts_14` animation `ice_burst`
- `telo_pini` (current) → `fx_spell_bursts_14` animation `water_burst`
- `kasi_wawa` (bloom) → `fx_spell_bursts_14` animation `poison_burst`

---

### `extra-elemental-spellcasting-effects-anti-alias-glow-14x14.png`

Identical layout to `extra-elemental-spellcasting-effects-14x14.png` (56×126, 14×14px, 4 cols × 9 rows). Anti-aliased glow variant — same strip names apply.

**Suggested spritesheet id:** `fx_spell_bursts_14_glow`

**Move-vfx binding:** Boss-tier version of the same bindings above. Use for jan lawa (region master) encounters.

---

### `fire-explosion-28x28.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/fire-explosion-28x28.png` |
| Dimensions | 336 × 28 px |
| Frame size | 28 × 28 px |
| Grid | 12 cols × 1 row |
| Total frames | 12 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | Fireball erupting outward — bright orange-red center expanding to ring, then dissipating into empty circles. Classic explosion one-shot. | 16 | no |

**Suggested spritesheet id:** `fx_fireball_explosion`

**Note:** The anti-alias-glow variant (`fire-explosion-anti-alias-glow.png`, same 336×28 dimensions) is registered separately as `fx_fireball_explosion_glow`.

**Move-vfx binding (recommend, not yet wired):**
- `seli_wawa` (blaze) → `fx_fireball_explosion` (primary binding; use glow variant for boss fights)

---

### `fire-explosion-anti-alias-glow.png`

Same layout as `fire-explosion-28x28.png` (336×28, 28×28px, 12 frames, single row).

**Suggested spritesheet id:** `fx_fireball_explosion_glow`

**Move-vfx binding:** Boss/rare encounter variant of `seli_wawa`.

---

### `fire-explosion-isometric-28x28.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/fire-explosion-isometric-28x28.png` |
| Dimensions | 336 × 28 px |
| Frame size | 28 × 28 px |
| Grid | 12 cols × 1 row |
| Total frames | 12 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | Same explosion progression as the standard variant but rendered for isometric perspective — slightly squashed ring, angled shockwave. | 16 | no |

**Suggested spritesheet id:** `fx_fireball_explosion_iso`

**Note:** The anti-alias-glow iso variant is registered as `fx_fireball_explosion_iso_glow`.

**Move-vfx binding:** Reserved for isometric-view map combat if that view is ever adopted. Current top-down view should use `fx_fireball_explosion` instead.

---

### `fire-explosion-isometric-anti-alias-glow-28x28.png`

Same layout as isometric (336×28, 28×28px, 12 frames).

**Suggested spritesheet id:** `fx_fireball_explosion_iso_glow`

---

### `ice-burst-crystal-48x48.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/ice-burst-crystal-48x48.png` |
| Dimensions | 384 × 48 px |
| Frame size | 48 × 48 px |
| Grid | 8 cols × 1 row |
| Total frames | 8 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | Yellow-gold crystalline shard burst — dense star at frame 0 spreading outward into scattered points, then fading. Reads as ice-crystal shatter impact. | 12 | no |

**Suggested spritesheet id:** `fx_ice_burst_crystal`

**Note:** The anti-alias-glow variant (`ice-burst-crystal-48x48-anti-alias-glow.png`, same layout) is registered as `fx_ice_burst_crystal_glow`.

**Move-vfx binding (recommend, not yet wired):**
- `lete_sewi` (frost) → `fx_ice_burst_crystal`
- `lete_wawa` (freeze) → `fx_ice_burst_crystal_glow`

---

### `ice-burst-crystal-48x48-anti-alias-glow.png`

Same layout as `ice-burst-crystal-48x48.png` (384×48, 48×48px, 8 frames).

**Suggested spritesheet id:** `fx_ice_burst_crystal_glow`

---

### `ice-burst-dark-blue-outline-48x48.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/ice-burst-dark-blue-outline-48x48.png` |
| Dimensions | 384 × 48 px |
| Frame size | 48 × 48 px |
| Grid | 8 cols × 1 row |
| Total frames | 8 |

**Strip read:** Same burst trajectory as the crystal variant, rendered with a dark-blue outline style — more legible on light backgrounds.

**Suggested spritesheet id:** `fx_ice_burst_blue`

**Move-vfx binding (recommend):** `lete_lili` (chill — weak ice) → `fx_ice_burst_blue`

---

### `ice-burst-light-grey-outline-48x48.png`

Same layout (384×48, 48×48px, 8 frames). Light grey outline — softer ice burst.

**Suggested spritesheet id:** `fx_ice_burst_grey`

**Move-vfx binding (recommend):** Ambient/status ice effect (no specific move; usable as a secondary particle when `effect: lower_defense` triggers on a lete move).

---

### `ice-burst-no-outline-48x48.png`

Same layout (384×48, 48×48px, 8 frames). No outline — blue tinted bare shards.

**Suggested spritesheet id:** `fx_ice_burst_bare`

**Move-vfx binding (recommend):** `lete_suli` (blizzard — strongest ice) → `fx_ice_burst_bare` (stark, raw ice shards fit the blizzard fantasy).

---

### `ice-burst-transparent-blue-outline-48x48.png`

Same layout (384×48, 48×48px, 8 frames). Transparent blue outline — designed to composite over other effects.

**Suggested spritesheet id:** `fx_ice_burst_tblue`

**Move-vfx binding (recommend):** Secondary layer composited over `fx_ice_burst_crystal` on `lete_wawa` hit.

---

### `large-fire-28x28.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/large-fire-28x28.png` |
| Dimensions | 112 × 84 px |
| Frame size | 28 × 28 px |
| Grid | 4 cols × 3 rows |
| Total frames | 12 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | 12-frame animated flame: small flame builds, flickers at full height across three rows of 4 frames each (read left-to-right, row by row). Continuous burn loop — suitable for ambient fire or sustained seli moves. | 10 | yes |

**Suggested spritesheet id:** `fx_large_fire`

**Note:** The anti-alias-glow variant (`large-fire-anti-alias-glow-28x28.png`, same 112×84 layout) is registered as `fx_large_fire_glow`.

**Move-vfx binding (recommend, not yet wired):**
- `seli_lili` (ember) → `fx_large_fire` (small fire attack — loops briefly then dismissed)
- `seli_wawa` (blaze) → `fx_large_fire_glow` (sustained blaze with glow)

---

### `large-fire-anti-alias-glow-28x28.png`

Same layout as `large-fire-28x28.png` (112×84, 28×28px, 4 cols × 3 rows, 12 frames, loop).

**Suggested spritesheet id:** `fx_large_fire_glow`

---

### `lightning-blast-54x18.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/lightning-blast-54x18.png` |
| Dimensions | 486 × 18 px |
| Frame size | 54 × 18 px |
| Grid | 9 cols × 1 row |
| Total frames | 9 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | Pale white/blue horizontal lightning bolt morphing through jagged shapes — bolt extends, branches, then crackles and dissipates. 9-frame one-shot electric strike. | 18 | no |

**Suggested spritesheet id:** `fx_lightning_blast`

**Note:** The anti-alias-glow variant (`lightning-blast-anti-alias-glow-54x18.png`, same 486×18 layout) is registered as `fx_lightning_blast_glow`.

**Move-vfx binding (recommend, not yet wired):**
- `telo_pini` (current — electric water) → `fx_lightning_blast` (telo type has shock/current flavor)

---

### `lightning-blast-anti-alias-glow-54x18.png`

Same layout (486×18, 54×18px, 9 frames).

**Suggested spritesheet id:** `fx_lightning_blast_glow`

---

### `lightning-energy-48x48.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/lightning-energy-48x48.png` |
| Dimensions | 432 × 48 px |
| Frame size | 48 × 48 px |
| Grid | 9 cols × 1 row |
| Total frames | 9 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | Warm orange energy orb / lightning sphere — starts small, swells into a branching electric globe, then fragments and dissipates. 9 frames. | 14 | no |

**Suggested spritesheet id:** `fx_lightning_energy`

**Note:** The anti-alias-glow variant (`lightning-energy-anti-alias-glow-48x48.png`, same 432×48 layout) is registered as `fx_lightning_energy_glow`.

**Move-vfx binding (recommend, not yet wired):**
- `telo_wawa` (wave — powerful water/shock) → `fx_lightning_energy`

---

### `lightning-energy-anti-alias-glow-48x48.png`

Same layout (432×48, 48×48px, 9 frames).

**Suggested spritesheet id:** `fx_lightning_energy_glow`

---

### `red-energy-48x48.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/red-energy-48x48.png` |
| Dimensions | 432 × 48 px |
| Frame size | 48 × 48 px |
| Grid | 9 cols × 1 row |
| Total frames | 9 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | Red-pink energy sphere, small at frame 0 expanding through branching red energy arcs into a full radiant circle, then fragmenting. Reads as dark/fighting energy — wawa type move impact. | 14 | no |

**Suggested spritesheet id:** `fx_red_energy`

**Note:** The anti-alias-glow variant (`red-energy-anti-alias-glow-48x48.png`, same 432×48 layout) is registered as `fx_red_energy_glow`.

**Move-vfx binding (recommend, not yet wired):**
- `utala` (fight) → `fx_red_energy`
- `utala_lili` (attack) → `fx_red_energy` (same effect, shorter duration)

---

### `red-energy-anti-alias-glow-48x48.png`

Same layout (432×48, 48×48px, 9 frames).

**Suggested spritesheet id:** `fx_red_energy_glow`

**Move-vfx binding (recommend):** `utala` boss-tier hit → `fx_red_energy_glow`.

---

### `red-lightning-blast-54x18.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/magical/red-lightning-blast-54x18.png` |
| Dimensions | 486 × 18 px |
| Frame size | 54 × 18 px |
| Grid | 9 cols × 1 row |
| Total frames | 9 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | Red/magenta jagged lightning bolt — same morphing arc as the standard lightning-blast but in crimson. Reads as a dark-energy or fire-lightning hybrid strike. | 18 | no |

**Suggested spritesheet id:** `fx_red_lightning_blast`

**Note:** Anti-alias-glow variant (`red-lightning-blast-anti-alias-glow-54x18.png`, same layout) registered as `fx_red_lightning_blast_glow`.

**Move-vfx binding (recommend, not yet wired):**
- `telo_suli` (torrent) → `fx_red_lightning_blast` (high-power water move with an electric undertone fits the red-energy aesthetic)

---

### `red-lightning-blast-anti-alias-glow-54x18.png`

Same layout (486×18, 54×18px, 9 frames).

**Suggested spritesheet id:** `fx_red_lightning_blast_glow`

---

## `weapon/` effects

### `slash-attack-effect-1.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/weapon/slash-attack-effect-1.png` |
| Dimensions | 50 × 126 px |
| Frame size | 25 × 14 px |
| Grid | 2 cols × 9 rows |
| Total frames | 18 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | 18 crescent arc shapes arranged in 2-column × 9-row grid — pale salmon/peach slash arcs rotating through angles, representing a spinning or sweeping blade strike. Frames read left-to-right, row-by-row. | 16 | no |

**Suggested spritesheet id:** `fx_sword_slash`

**Move-vfx binding (recommend, not yet wired):**
- `utala` (fight — melee physical) → `fx_sword_slash`
- `utala_lili` (attack — light physical) → `fx_sword_slash`
- `kiwen_wawa` (stoneblow — heavy physical) → `fx_sword_slash` (shared physical VFX until a dedicated rock impact is authored)

---

### `staff-attack-effect-1.png`

| Property | Value |
|---|---|
| Source | `public/assets/effects/weapon/staff-attack-effect-1.png` |
| Dimensions | 32 × 64 px |
| Frame size | 16 × 16 px |
| Grid | 2 cols × 4 rows |
| Total frames | 8 |

**Strip read:**

| Strip | What I see | fps | loop |
|---|---|---|---|
| `play` | 8 small peach arc/puff shapes — half-moon arcs arranged in 2-col × 4-row layout. Each frame shows a slightly rotated crescent, suggesting a light tap or swish. Reads as a staff or wand impact puff. | 14 | no |

**Suggested spritesheet id:** `fx_staff_swish`

**Move-vfx binding (recommend, not yet wired):**
- `telo_lili` (splash) → `fx_staff_swish` (water staff tap)
- `kasi_lili` (leaf) → `fx_staff_swish` (nature wand strike)

---

## Move-binding summary

| Move | Type | Recommended vfx | Notes |
|---|---|---|---|
| `utala_lili` | wawa | `fx_sword_slash` | Light physical |
| `utala` | wawa | `fx_sword_slash` + `fx_red_energy` | Melee + impact combo |
| `kiwen_wawa` | wawa | `fx_dirt_kickup` | Ground heavy strike |
| `kon_wawa` | wawa | `fx_gas_cloud` | Wind/air themed |
| `wawa_waso` | wawa | `fx_feather_drift` | Bird aerial strike |
| `seli_lili` | seli | `fx_spell_orbs_v1` (fire_orb) + `fx_large_fire` | Small fire |
| `seli_wawa` | seli | `fx_fireball_explosion_glow` + `fx_large_fire_glow` | Large blaze |
| `lete_lili` | lete | `fx_ice_burst_blue` | Light chill |
| `lete_sewi` | lete | `fx_ice_burst_crystal` | Frost shards |
| `lete_wawa` | lete | `fx_ice_burst_crystal_glow` | Strong freeze |
| `lete_suli` | lete | `fx_ice_burst_bare` | Blizzard raw ice |
| `telo_lili` | telo | `fx_staff_swish` | Water tap |
| `telo_pini` | telo | `fx_lightning_blast` | Electric current |
| `telo_wawa` | telo | `fx_lightning_energy` | Powerful water/shock |
| `telo_suli` | telo | `fx_red_lightning_blast` | Torrent surge |
| `kasi_lili` | kasi | `fx_spell_orbs_v1` (poison_orb) + `fx_staff_swish` | Leaf/nature |
| `kasi_wawa` | kasi | `fx_spell_bursts_14` (poison_burst) | Bloom impact |
