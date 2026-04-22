---
title: Combatant Sprites
updated: 2026-04-22
status: current
domain: technical
---

# Combatant Sprite Manifest

Human trainer sprites for rivals and jan lawa (jan Ike, jan Wawa, jan Telo, jan Lete, jan Suli).
Located in `public/assets/combatants/` under three sub-packs: `mages/`, `rogues/`, `warriors/`.

Combatants are **NOT catchable creatures**. They do not appear in `src/content/spine/species/`.
Their canonical spritesheet records live in `src/content/gameplay/visuals.json`; trainer
bindings live in `src/content/gameplay/trainers.json`; `src/config/combatant-sprites.ts`
registers those JSON records into RPG.js and the trainer factories apply them via
`setGraphic()`. The client registration maps explicit `stand`, `walk`, `attack`,
`skill`, `defense`, and `hurt` textures from the full 31-row overworld sheets so
action-battle trainers do not fall back to a walk-only preset.

## Sprite naming convention

`combatant_<class>_<variant>` — e.g. `combatant_warrior_axe`, `combatant_mage_fem_red`.

## NPC ↔ sprite binding (canonical)

| NPC                          | Sprite ID                     | Source file                                           | Rationale                                                |
| ---------------------------- | ----------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| jan Ike (rival)              | `combatant_rogue_hooded`      | `rogues/hooded-rogue-non-combat-daggers-equipped.png` | Hooded rogue = sneaky rival archetype                    |
| jan Wawa (region 3 jan lawa) | `combatant_warrior_axe`       | `warriors/axe-warrior-16x16.png`                      | Axe warrior = raw physical strength, wawa type           |
| jan Telo (region 4 jan lawa) | `combatant_mage_fem_red`      | `mages/mage-fem-red.png`                              | Red mage, elemental caster; fits water/lake aesthetic    |
| jan Lete (region 5 jan lawa) | `combatant_mage_hooded_brown` | `mages/mage-hooded-brown.png`                         | Hooded/cloaked mage = cold, northern, ice master         |
| jan Suli (region 6 jan lawa) | `combatant_warrior_paladin`   | `warriors/paladin/non-combat-animations.png`          | Paladin = champion-tier, hardest jan lawa before endgame |

---

## MAGES pack

### `mage-fem-red.png` — ID: `combatant_mage_fem_red`

**Path:** `public/assets/combatants/mages/mage-fem-red.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** jan Telo (region 4 jan lawa)

4-directional overworld walk sheet. Red-robed feminine mage with elemental casting stance at bottom.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `cast`       | 8   | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `mage-fem-red-combat.png` — ID: `combatant_mage_fem_red_combat`

**Path:** `public/assets/combatants/mages/mage-fem-red-combat.png`  
**Dimensions:** 64×256  
**Frame size:** 32×32  
**Grid:** 2 cols × 8 rows  
**Used by:** (document-only — not currently bound; available for future combat-scene overlay)

Close-up combat sheet. 2 frames wide, 8 animation rows.

| Row | Frames | Animation  | fps | loop |
| --- | ------ | ---------- | --- | ---- |
| 0   | 2      | `idle`     | 4   | yes  |
| 1   | 2      | `idle_alt` | 4   | yes  |
| 2   | 2      | `walk`     | 8   | yes  |
| 3   | 2      | `cast`     | 8   | no   |
| 4   | 2      | `attack`   | 10  | no   |
| 5   | 2      | `taunt`    | 6   | no   |
| 6   | 2      | `hurt`     | 8   | no   |
| 7   | 2      | `defeat`   | 5   | no   |

---

### `mage-hooded-brown.png` — ID: `combatant_mage_hooded_brown`

**Path:** `public/assets/combatants/mages/mage-hooded-brown.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** jan Lete (region 5 jan lawa)

4-directional overworld walk sheet. Hooded brown-robed mage; cowl pulled low — fits the cold, withdrawn ice-master character.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `cast`       | 8   | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `mage-hooded-brown-combat.png` — ID: `combatant_mage_hooded_brown_combat`

**Path:** `public/assets/combatants/mages/mage-hooded-brown-combat.png`  
**Dimensions:** 64×256  
**Frame size:** 32×32  
**Grid:** 2 cols × 8 rows  
**Used by:** (document-only — not currently bound)

Same animation row layout as `mage-fem-red-combat.png`.

| Row | Frames | Animation  | fps | loop |
| --- | ------ | ---------- | --- | ---- |
| 0   | 2      | `idle`     | 4   | yes  |
| 1   | 2      | `idle_alt` | 4   | yes  |
| 2   | 2      | `walk`     | 8   | yes  |
| 3   | 2      | `cast`     | 8   | no   |
| 4   | 2      | `attack`   | 10  | no   |
| 5   | 2      | `taunt`    | 6   | no   |
| 6   | 2      | `hurt`     | 8   | no   |
| 7   | 2      | `defeat`   | 5   | no   |

---

### `mage-masc-dkgrey-sheet.png` — ID: `combatant_mage_masc_dkgrey`

**Path:** `public/assets/combatants/mages/mage-masc-dkgrey-sheet.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** (document-only — not currently bound; available for a future NPC or minor antagonist)

4-directional overworld walk sheet. Dark-grey-robed masculine mage with angular posture. `mage-masc-dkgrey.png` is identical in structure (same sheet, alternate filename).

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `cast`       | 8   | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `mage-masc-dkgrey-combat.png` — ID: `combatant_mage_masc_dkgrey_combat`

**Path:** `public/assets/combatants/mages/mage-masc-dkgrey-combat.png`  
**Dimensions:** 64×256  
**Frame size:** 32×32  
**Grid:** 2 cols × 8 rows  
**Used by:** (document-only — not currently bound)

Same animation row layout as `mage-fem-red-combat.png`.

| Row | Frames | Animation  | fps | loop |
| --- | ------ | ---------- | --- | ---- |
| 0   | 2      | `idle`     | 4   | yes  |
| 1   | 2      | `idle_alt` | 4   | yes  |
| 2   | 2      | `walk`     | 8   | yes  |
| 3   | 2      | `cast`     | 8   | no   |
| 4   | 2      | `attack`   | 10  | no   |
| 5   | 2      | `taunt`    | 6   | no   |
| 6   | 2      | `hurt`     | 8   | no   |
| 7   | 2      | `defeat`   | 5   | no   |

---

### `mage-masc-dkgrey.png`

**Path:** `public/assets/combatants/mages/mage-masc-dkgrey.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Skipped:** Identical spritesheet to `mage-masc-dkgrey-sheet.png` (duplicate filename; `-sheet` variant is canonical). No separate ID registered.

---

## ROGUES pack

### `hooded-rogue-non-combat-daggers-equipped.png` — ID: `combatant_rogue_hooded`

**Path:** `public/assets/combatants/rogues/hooded-rogue-non-combat-daggers-equipped.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** jan Ike (rival)

4-directional overworld walk sheet. Dark-hooded rogue with paired daggers at belt. The hood and daggers match jan Ike's competitive-but-not-malicious rival archetype — quick and sneaky but not a villain.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `attack`     | 10  | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `hooded-rogue-daggers-and-bow-combat-without-attack-effects.png` — ID: `combatant_rogue_hooded_combat`

**Path:** `public/assets/combatants/rogues/hooded-rogue-daggers-and-bow-combat-without-attack-effects.png`  
**Dimensions:** 64×320  
**Frame size:** 32×32  
**Grid:** 2 cols × 10 rows  
**Used by:** (document-only — not currently bound)

Close-up combat sheet. Hooded rogue, no attack-effect overlay. Cleaner for engine rendering.

| Row | Frames | Animation | fps | loop |
| --- | ------ | --------- | --- | ---- |
| 0   | 2      | `idle`    | 4   | yes  |
| 1   | 2      | `walk`    | 8   | yes  |
| 2   | 2      | `sneak`   | 6   | yes  |
| 3   | 2      | `attack`  | 12  | no   |
| 4   | 2      | `cast`    | 8   | no   |
| 5   | 2      | `taunt`   | 6   | no   |
| 6   | 2      | `flee`    | 10  | yes  |
| 7   | 2      | `defend`  | 6   | yes  |
| 8   | 2      | `hurt`    | 8   | no   |
| 9   | 2      | `defeat`  | 5   | no   |

---

### `hooded-rogue-daggers-and-bow-combat-with-attack-effects.png` — ID: `combatant_rogue_hooded_combat_fx`

**Path:** `public/assets/combatants/rogues/hooded-rogue-daggers-and-bow-combat-with-attack-effects.png`  
**Dimensions:** 96×480  
**Frame size:** 32×32  
**Grid:** 3 cols × 15 rows  
**Used by:** (document-only — not currently bound; attack-effect overlays baked into the sheet)

Combat sheet with embedded attack FX. 3 cols wide to accommodate weapon-swing overlap.

| Row  | Frames | Animation | fps | loop |
| ---- | ------ | --------- | --- | ---- |
| 0    | 3      | `idle`    | 4   | yes  |
| 1    | 3      | `walk`    | 8   | yes  |
| 2    | 3      | `sneak`   | 6   | yes  |
| 3    | 3      | `attack`  | 12  | no   |
| 4    | 3      | `cast`    | 8   | no   |
| 5    | 3      | `taunt`   | 6   | no   |
| 6    | 3      | `flee`    | 10  | yes  |
| 7    | 3      | `defend`  | 6   | yes  |
| 8    | 3      | `hurt`    | 8   | no   |
| 9–14 | 3      | `special` | 10  | no   |

---

### `hooded-rogue-non-combat-bow-equipped.png` — ID: `combatant_rogue_hooded_bow`

**Path:** `public/assets/combatants/rogues/hooded-rogue-non-combat-bow-equipped.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** (document-only — not currently bound; bow variant for a possible future ranged-rival appearance)

Same animation layout as `combatant_rogue_hooded` but bow equipped at back.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `attack`     | 10  | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `rogue-non-combat-daggers-equipped.png` — ID: `combatant_rogue_unhooded`

**Path:** `public/assets/combatants/rogues/rogue-non-combat-daggers-equipped.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** (document-only — not currently bound; unhooded variant for a second rival or minor NPC)

Same animation layout. No hood — clearer facial silhouette.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `attack`     | 10  | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `rogue-daggers-and-bow-combat-without-attack-effects.png` — ID: `combatant_rogue_unhooded_combat`

**Path:** `public/assets/combatants/rogues/rogue-daggers-and-bow-combat-without-attack-effects.png`  
**Dimensions:** 64×320  
**Frame size:** 32×32  
**Grid:** 2 cols × 10 rows  
**Used by:** (document-only — not currently bound)

Same row layout as `combatant_rogue_hooded_combat`.

| Row | Frames | Animation | fps | loop |
| --- | ------ | --------- | --- | ---- |
| 0   | 2      | `idle`    | 4   | yes  |
| 1   | 2      | `walk`    | 8   | yes  |
| 2   | 2      | `sneak`   | 6   | yes  |
| 3   | 2      | `attack`  | 12  | no   |
| 4   | 2      | `cast`    | 8   | no   |
| 5   | 2      | `taunt`   | 6   | no   |
| 6   | 2      | `flee`    | 10  | yes  |
| 7   | 2      | `defend`  | 6   | yes  |
| 8   | 2      | `hurt`    | 8   | no   |
| 9   | 2      | `defeat`  | 5   | no   |

---

### `rogue-daggers-and-bow-combat-with-attack-effects.png` — ID: `combatant_rogue_unhooded_combat_fx`

**Path:** `public/assets/combatants/rogues/rogue-daggers-and-bow-combat-with-attack-effects.png`  
**Dimensions:** 96×480  
**Frame size:** 32×32  
**Grid:** 3 cols × 15 rows  
**Used by:** (document-only — not currently bound)

Same row layout as `combatant_rogue_hooded_combat_fx`.

| Row  | Frames | Animation | fps | loop |
| ---- | ------ | --------- | --- | ---- |
| 0    | 3      | `idle`    | 4   | yes  |
| 1    | 3      | `walk`    | 8   | yes  |
| 2    | 3      | `sneak`   | 6   | yes  |
| 3    | 3      | `attack`  | 12  | no   |
| 4    | 3      | `cast`    | 8   | no   |
| 5    | 3      | `taunt`   | 6   | no   |
| 6    | 3      | `flee`    | 10  | yes  |
| 7    | 3      | `defend`  | 6   | yes  |
| 8    | 3      | `hurt`    | 8   | no   |
| 9–14 | 3      | `special` | 10  | no   |

---

### `rogue-non-combat-bow-equipped.png` — ID: `combatant_rogue_unhooded_bow`

**Path:** `public/assets/combatants/rogues/rogue-non-combat-bow-equipped.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** (document-only — not currently bound)

Unhooded rogue, bow equipped. Same animation layout as other non-combat overworld sheets.

---

## WARRIORS pack

### `axe-warrior-16x16.png` — ID: `combatant_warrior_axe`

**Path:** `public/assets/combatants/warriors/axe-warrior-16x16.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** jan Wawa (region 3 jan lawa)

4-directional overworld walk sheet. Orange-armored warrior with large axe. Heavy-set silhouette reads as physical strength — fitting for the wawa-type mountain jan lawa.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `attack`     | 12  | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `axe-warrior-combat-32x32.png` — ID: `combatant_warrior_axe_combat`

**Path:** `public/assets/combatants/warriors/axe-warrior-combat-32x32.png`  
**Dimensions:** 128×640  
**Frame size:** 32×32  
**Grid:** 4 cols × 20 rows  
**Used by:** (document-only — not currently bound)

4-directional combat sheet with attack-effect overlays. 4 cols = 4 directional slices per animation.

| Rows  | Frames | Animation                                                              | fps | loop |
| ----- | ------ | ---------------------------------------------------------------------- | --- | ---- |
| 0–3   | 4      | `walk_down` / `walk_left` / `walk_right` / `walk_up` (one dir per row) | 8   | yes  |
| 4–7   | 4      | `idle` (4 directions)                                                  | 4   | yes  |
| 8–11  | 4      | `attack` (4 directions)                                                | 12  | no   |
| 12–15 | 4      | `hurt` (4 directions)                                                  | 8   | no   |
| 16–19 | 4      | `defeat` (4 directions)                                                | 5   | no   |

---

### `axe-warrior-combat-without-attack-effect-24x24.png` — ID: `combatant_warrior_axe_combat_clean`

**Path:** `public/assets/combatants/warriors/axe-warrior-combat-without-attack-effect-24x24.png`  
**Dimensions:** 96×480  
**Frame size:** 24×24  
**Grid:** 4 cols × 20 rows  
**Used by:** (document-only — not currently bound; preferred for clean rendering without baked FX)

Same animation layout as `combatant_warrior_axe_combat` at 24×24.

---

### `caped-warrior-16x16.png` — ID: `combatant_warrior_caped`

**Path:** `public/assets/combatants/warriors/caped-warrior-16x16.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** (document-only — not currently bound; cape/cloak silhouette available for a future noble warrior NPC)

4-directional overworld walk sheet. Caped warrior with sword and colorful cloak. Distinguished, hero-like silhouette.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `attack`     | 12  | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `caped-warrior-combat-32x32.png` — ID: `combatant_warrior_caped_combat`

**Path:** `public/assets/combatants/warriors/caped-warrior-combat-32x32.png`  
**Dimensions:** 128×640  
**Frame size:** 32×32  
**Grid:** 4 cols × 20 rows  
**Used by:** (document-only — not currently bound)

Same directional layout as `combatant_warrior_axe_combat`. Caped silhouette with cape-swing in attack frames.

---

### `caped-warrior-combat-without-attack-effect-24x24.png` — ID: `combatant_warrior_caped_combat_clean`

**Path:** `public/assets/combatants/warriors/caped-warrior-combat-without-attack-effect-24x24.png`  
**Dimensions:** 96×480  
**Frame size:** 24×24  
**Grid:** 4 cols × 20 rows  
**Used by:** (document-only — not currently bound)

---

### `skullcap-warrior-non-combat.png` — ID: `combatant_warrior_skullcap`

**Path:** `public/assets/combatants/warriors/skullcap-warrior-non-combat.png`  
**Dimensions:** 64×496  
**Frame size:** 16×16  
**Grid:** 4 cols × 31 rows  
**Used by:** (document-only — not currently bound; dark heavy armor; available for a future antagonist or guard NPC)

4-directional overworld walk sheet. Dark-armored skullcap warrior with heavy axe. Intimidating silhouette.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `attack`     | 12  | no   |
| 24–26     | 4      | `hurt`       | 8   | no   |
| 27–30     | 4      | `defeat`     | 5   | no   |

---

### `skullcap-warrior-combat-32x32.png` — ID: `combatant_warrior_skullcap_combat`

**Path:** `public/assets/combatants/warriors/skullcap-warrior-combat-32x32.png`  
**Dimensions:** 128×640  
**Frame size:** 32×32  
**Grid:** 4 cols × 20 rows  
**Used by:** (document-only — not currently bound)

---

### `skullcap-warrior-combat-without-attackeffect-24x24.png` — ID: `combatant_warrior_skullcap_combat_clean`

**Path:** `public/assets/combatants/warriors/skullcap-warrior-combat-without-attackeffect-24x24.png`  
**Dimensions:** 96×480  
**Frame size:** 24×24  
**Grid:** 4 cols × 20 rows  
**Used by:** (document-only — not currently bound)

---

### `warriors/paladin/non-combat-animations.png` — ID: `combatant_warrior_paladin`

**Path:** `public/assets/combatants/warriors/paladin/non-combat-animations.png`  
**Dimensions:** 96×744  
**Frame size:** 24×24  
**Grid:** 4 cols × 31 rows  
**Used by:** jan Suli (region 6 jan lawa — champion tier)

4-directional overworld walk + extended animation sheet. White/red-accented paladin with shield and sword. The paladin archetype — disciplined champion — fits jan Suli as the hardest jan lawa before the endgame.

| Row range | Frames | Animation    | fps | loop |
| --------- | ------ | ------------ | --- | ---- |
| 0–2       | 4      | `walk_down`  | 8   | yes  |
| 3–5       | 4      | `walk_left`  | 8   | yes  |
| 6–8       | 4      | `walk_right` | 8   | yes  |
| 9–11      | 4      | `walk_up`    | 8   | yes  |
| 12–14     | 4      | `idle`       | 4   | yes  |
| 15–17     | 4      | `idle_alt`   | 4   | yes  |
| 18–20     | 4      | `taunt`      | 6   | no   |
| 21–23     | 4      | `attack`     | 12  | no   |
| 24–26     | 4      | `defend`     | 6   | yes  |
| 27–30     | 4      | `hurt`       | 8   | no   |

Note: The paladin sheet is 96px wide (24×24 frames, 4 cols) and 744px tall — exactly
31 rows. No rows beyond 0–30 are present or registered; the runtime
`framesWidth: 4` / `framesHeight: 31` covers the full sheet.

---

### `warriors/paladin/combat-32x32.png` — ID: `combatant_warrior_paladin_combat`

**Path:** `public/assets/combatants/warriors/paladin/combat-32x32.png`  
**Dimensions:** 128×384  
**Frame size:** 32×32  
**Grid:** 4 cols × 12 rows  
**Used by:** (document-only — not currently bound)

Compact combat sheet. 4-directional, 12 animation rows.

| Rows | Frames | Animation                        | fps | loop |
| ---- | ------ | -------------------------------- | --- | ---- |
| 0–3  | 4      | `idle` (4 directions)            | 4   | yes  |
| 4–7  | 4      | `attack` (4 directions)          | 12  | no   |
| 8–11 | 4      | `hurt` / `defeat` (4 directions) | 8   | no   |

---

### `warriors/paladin/combat-without-attack-effect-24x24.png` — ID: `combatant_warrior_paladin_combat_clean`

**Path:** `public/assets/combatants/warriors/paladin/combat-without-attack-effect-24x24.png`  
**Dimensions:** 96×288  
**Frame size:** 24×24  
**Grid:** 4 cols × 12 rows  
**Used by:** (document-only — not currently bound)

---

### `warriors/paladin/combat-thrust.png` — skipped

**Path:** `public/assets/combatants/warriors/paladin/combat-thrust.png`  
**Dimensions:** 192×96  
**Skipped:** Single-strip effect overlay (thrust animation in one horizontal band). Not an overworld
or portrait sheet — this is a weapon-effect sprite meant to be layered over the combat sheet.
No ID registered.

---

### `warriors/paladin/combat-thrust+dash.png` — skipped

**Path:** `public/assets/combatants/warriors/paladin/combat-thrust+dash.png`  
**Dimensions:** 256×128  
**Skipped:** Two-strip attack-effect overlay (thrust + dash). Same reason as `combat-thrust.png`.
No ID registered.

---

### `warriors/paladin/thrust-attack-effect.png` — skipped

**Path:** `public/assets/combatants/warriors/paladin/thrust-attack-effect.png`  
**Dimensions:** 96×96  
**Skipped:** Isolated attack-effect tile (one frame, 96×96). Not a character spritesheet.
No ID registered.

---

## Summary

| Category               | Total sheets | Bound to NPC                            | Document-only | Skipped                              |
| ---------------------- | ------------ | --------------------------------------- | ------------- | ------------------------------------ |
| Mages                  | 7            | 2 (`mage-fem-red`, `mage-hooded-brown`) | 4             | 1 (duplicate `mage-masc-dkgrey.png`) |
| Rogues                 | 8            | 1 (`hooded-rogue-non-combat-daggers`)   | 7             | 0                                    |
| Warriors (non-paladin) | 9            | 1 (`axe-warrior-16x16`)                 | 8             | 0                                    |
| Warriors (paladin)     | 6            | 1 (`paladin/non-combat-animations`)     | 2             | 3 (effect-only strips)               |
| **Total**              | **30**       | **5**                                   | **21**        | **4**                                |
