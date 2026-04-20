---
title: Combat & Encounters
updated: 2026-04-20
status: current
domain: technical
---

# Combat & Encounters

Two distinct combat loops exist in **poki soweli**:

1. **Wild encounters** — dialog-gated capture prompts that fire when the
   player walks into a tall-grass / Encounter shape. Goal: build the
   party by capturing creatures with a poki (net). Implemented in
   `src/modules/main/encounter.ts`.
2. **Action-battle set-pieces** — real-time combat against trainers and
   jan lawa (gym leaders). Goal: defeat the named opponent to advance a
   journey beat. Powered by `@rpgjs/action-battle` once a rival or gym
   sprite is wired. Not live yet.

This doc specs loop (1); loop (2) is stubbed at the journey level and
will be fleshed out when the first rival (`jan_ike`, beat 2) gets
implemented.

## Wild encounter contract

### Authoring

Encounter zones are declared on a map spec under
`layers.Encounters: EncounterZone[]`. The emitter writes them to the
Tiled `Encounters` object group, one `<object type="Encounter">` per
zone with three custom properties:

- `species` — JSON object `{ species_id: weight, ... }`
- `level_min` — int, lower bound of the encounter level band
- `level_max` — int, upper bound

Example (from `scripts/map-authoring/specs/nasin_wan.ts`):

```ts
Encounters: [
  { rect: [6, 3, 4, 2], species: { pipi_kon: 40, akesi_ma: 35, kala_lili: 25 }, levelRange: [3, 5] },
]
```

### Runtime

1. `player.ts` registers `onInShape(player, shape)`.
2. If `shape.name` starts with `encounter_` (the emitter names zones
   `encounter_0`, `encounter_1`, ...), `handleEncounterShapeEntered`
   fires with the shape's raw properties.
3. A per-entry coin flip (`ENCOUNTER_PROBABILITY_PER_STEP = 0.12`)
   decides whether the zone triggers. No trigger → silent return.
4. On trigger: roll a species id from the weighted table, roll a level
   from the band, look up the species record in `generated/world.json`.
5. Play the `wild_encounter_appear` dialog beat; seed the species root
   word into `mastered_words` (V5 will deepen this).
6. `player.showChoices('?', [{text: 'poki', value: 'catch'}, {text: 'tawa', value: 'flee'}])`.
7. On `flee`: log outcome `fled` to `encounter_log`, exit.
8. On `catch`: `Math.random() < species.catch_rate` decides success.
   - Success → `addToParty(species_id, level)` (inserts into
     `party_roster` if under 6 members), log `caught`, play
     `wild_encounter_caught`.
   - Failure → log `escaped`, play `wild_encounter_escaped`.

### Dialog

Every user-facing string routes through
`src/content/spine/dialog/<id>.json` and resolves via Tatoeba at
`pnpm build-spine`. The three system dialog nodes are:

- `wild_encounter_appear` — pre-choice prompt
- `wild_encounter_caught` — success branch
- `wild_encounter_escaped` — failure branch

Per project rules, hand-authoring TP in encounter code is forbidden.
If a new line is needed, author EN in a new dialog JSON file and run
`pnpm validate-tp`.

### Persistence

- **Capacitor Preferences** — nothing encounter-specific today; future:
  cache the last encounter seed for deterministic replay in dev builds.
- **SQLite** — two tables back this loop:
  - `party_roster (slot, species_id, level, caught_at)` — 0-indexed
    slot, max 6. `addToParty` is a no-op once full.
  - `encounter_log (id, species_id, map_id, outcome, logged_at)` —
    append-only, records every fled/caught/escaped event.

### What loop (1) intentionally does NOT do

- HP reduction before capture (Pokeball-style "weaken first"). The
  mechanic is deliberately simpler: flat `catch_rate` roll. This
  matches the kid-friendly target audience.
- Creature-vs-creature fights. Captured creatures live in
  `party_roster` but have no active combat role yet; their combat
  behavior lands with loop (2).
- Running XP, evolutions, status effects. Those belong in a later
  slice once the action-battle path is live.

## Action-battle set-pieces (stub)

Designated fights, one per journey beat 2+:

| Beat | NPC | Role | Party |
|------|-----|------|-------|
| 2 | jan_ike | rival | soweli_seli L5 + two starter moves |
| 3 | jan_wawa | first jan lawa | waso_sewi L8 → soweli_lete L10 |
| 4 | jan_telo | jan lawa | kala_suli L10 + kasi_pona L12 |
| 5 | jan_lete | jan lawa | waso_lete L10 + soweli_lete_suli L13 |
| 6 | jan_suli | jan lawa | waso_sewi L12 + soweli_lete_suli L14 |
| 7 | green dragon | final boss | — (cutscene + unique death animation) |

The action-battle module (`@rpgjs/action-battle`) provides a
`provideActionBattle()` + `createActionBattleServer()` pair plus
`DEFAULT_PLAYER_ATTACK_HITBOXES` for direction-aware melee. Wiring
one fight end-to-end will land with the jan_ike rival beat; the
gym-leader beats follow the same pattern.
