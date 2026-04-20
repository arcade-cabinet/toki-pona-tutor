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

- HP reduction before capture ("weaken first" in other catch-based
  RPGs). Our mechanic is deliberately simpler: flat `catch_rate` roll.
  This matches the kid-friendly target audience.
- Creature-vs-creature fights. Captured creatures live in
  `party_roster` but have no active combat role yet; their combat
  behavior lands with loop (2).
- Running XP, evolutions, status effects. Those belong in a later
  slice once the action-battle path is live.

## Action-battle set-pieces

Designated fights, one per journey beat 2+:

| Beat | NPC | Role | Stats (current) | Flag on defeat |
|------|-----|------|-----------------|----------------|
| 2 | `jan_ike` | rival | HP 60, ATK 14, PDEF 8, `EnemyType.Aggressive` | `jan_ike_defeated` |
| 3 | `jan_wawa` | first jan lawa | TBD — gym leader | `badge_sewi` |
| 4 | `jan_telo` | jan lawa | TBD | `badge_telo` |
| 5 | `jan_lete` | jan lawa | TBD | `badge_lete` |
| 6 | `jan_suli` | jan lawa | TBD | `badge_suli` |
| 7 | green dragon | final boss | cutscene + unique death animation | end |

### Wiring (implemented for jan_ike, pattern for the rest)

1. **Provider** — `provideActionBattle()` is registered in both
   `src/server.ts` (after `provideTiledMap`) and
   `src/config/config.client.ts` (after `provideTiledMap`). Registering
   on both sides is required: the server runs AI + hit resolution, the
   client renders the action bar + attack hitboxes.

2. **Event factory** — `src/modules/main/jan-ike.ts` exports `JanIke()`:
   ```ts
   onInit() {
     this.setGraphic('female');
     this.hp = 60;
     this.param[ATK] = 14;
     this.param[PDEF] = 8;
     new BattleAi(this, {
       enemyType: EnemyType.Aggressive,
       attackCooldown: 900,
       visionRange: 140,
       attackRange: 28,
       fleeThreshold: 0,       // rivals don't flee; gym leaders may
       onDefeated: async (_, attacker) => {
         await setFlag('jan_ike_defeated', '1');
         if (attacker) {
           await playDialog(attacker, 'jan_ike_victory');
           await preferences.set(KEYS.journeyBeat, 'beat_03_nena_sewi');
         }
       },
     });
   }
   ```

3. **Registration** — the event is attached to the `nasin_wan` map in
   `src/modules/main/server.ts` with coords matching the NPC object in
   `scripts/map-authoring/specs/nasin_wan.ts` (jan-ike at tile [28,5] =
   px [448, 88]).

4. **Dialog** — two Tatoeba-gated dialog nodes:
   - `jan_ike_intro` (fires on `onAction` while flag unset)
   - `jan_ike_victory` (fires from the `onDefeated` callback and on
     `onAction` after defeat)

5. **Flag propagation** — `setFlag('jan_ike_defeated', '1')` writes to
   the `flags` SQLite table. The east warp on nasin_wan reads it via
   `getFlag` and opens the route to `nena_sewi`.

6. **Journey pointer** — `preferences.set(KEYS.journeyBeat, ...)`
   advances the stored beat so load/resume boots into the correct
   state.

### What the action-battle module provides

- `provideActionBattle(options?)` — wires the module on client + server
- `BattleAi(event, { enemyType, onDefeated, ... })` — AI controller
  attached in `onInit`. Handles vision, chase, attack cadence.
- `EnemyType` enum: `Aggressive | Defensive | Ranged | Tank | Berserker`
- `DEFAULT_PLAYER_ATTACK_HITBOXES` — direction-aware melee hitboxes;
  the player attacks with these by default when the action-battle
  provider is active.

### Pattern for the four gym leaders (V8+)

Same event-factory shape as `JanIke`, but:
- `enemyType: EnemyType.Defensive` or `Tank` for tougher fights
- `fleeThreshold: 0.25` optional — they never flee
- Multi-phase: swap AI with a second `BattleAi` when HP drops below
  threshold (the module supports phase transitions via `phases` —
  TODO when the first gym leader lands)
- Call `setFlag('badge_<region>')` and `preferences.set(KEYS.journeyBeat, ...)`
- Author `<npc>_intro` + `<npc>_victory` dialog JSON, Tatoeba-gated

### Loss / retry behavior

When the player's HP hits 0 RPG.js fires `onDead(player)`, which we
hook in `src/modules/main/player.ts`. The handler delegates to
`respawnAtLastSafeMap` in `src/modules/main/respawn.ts`:

1. Read `KEYS.lastSafeMapId` + `lastSafeSpawnX/Y` from Capacitor
   Preferences. If unset (first run, fresh boot), fall back to
   `ma_tomo_lili` at [128, 128].
2. Play the `game_over_revive` dialog node. Kid-friendly tone —
   "You seem well..." rather than a dramatic death screen.
3. Restore `player.hp = player.param.maxhp` so the player wakes at
   full HP.
4. `changeMap` to the safe location.

The respawn anchor is updated whenever the player warps into a
village (`markSafeMapIfVillage` called from `Warp.onPlayerTouch`).
The current safe-village roster is `ma_tomo_lili`, `ma_telo`,
`ma_lete` — plus whatever else ships in V11+. Routes and gyms are
NOT safe maps, so a loss rolls the player back to the last town
they rested in, which also encodes the save-progress metaphor.

**What we deliberately don't do:**
- No permadeath, ever. Party roster is preserved across a loss
  (kid audience — losing a caught creature would feel terrible).
- No XP penalty / gold loss. Loss is a setback, not a punishment.
- No game-over screen. The transition is dialog → map-change and
  play resumes.
