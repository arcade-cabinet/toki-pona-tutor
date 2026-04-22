---
title: Combat & Encounters
updated: 2026-04-22
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
   jan lawa (region masters). Goal: defeat the named opponent to advance a
   journey beat. Powered by `@rpgjs/action-battle`, `JanIke()`,
   `GymLeader()`, and `GreenDragon()`.

Both loops are live in the current seven-map arc. Wild encounters carry
party growth and catch UX; action-battle carries rival, four jan lawa,
badge gates, the green-dragon endgame encounter, combat music, XP, `ma` rewards, and autosave.

## Wild encounter contract

### Authoring

Encounter zones are declared on a map spec under
`layers.Encounters: EncounterZone[]`. The emitter writes them to the
Tiled `Encounters` object group, one `<object type="Encounter">` per
zone with three custom properties:

-   `species` — JSON object `{ species_id: weight, ... }`
-   `level_min` — int, lower bound of the encounter level band
-   `level_max` — int, upper bound

Example (from `scripts/map-authoring/specs/nasin_wan.ts`):

```ts
Encounters: [
    {
        rect: [4, 6, 5, 3],
        species: { jan_ike_lili: 25, jan_utala_lili: 20, soweli_musi: 20, soweli_kili: 15, soweli_jaki: 10, waso_pimeja: 10 },
        levelRange: [3, 5],
    },
];
```

### Runtime

1. `player.ts` registers `onInShape(player, shape)`.
2. If `shape.name` starts with `encounter_` (the emitter names zones
   `encounter_0`, `encounter_1`, ...), `handleEncounterShapeEntered`
   fires with the shape's raw properties.
3. A per-entry coin flip using `ENCOUNTER_CONFIG.probabilityPerStep`
   from `src/content/gameplay/combat.json` decides whether the zone
   triggers. No trigger → silent return.
4. On trigger: roll a species id from the weighted table, roll a level
   from the band, look up the species record in `generated/world.json`.
5. Play the configured wild encounter appearance dialog beat, seed the
   species root word into `mastered_words`, and record bestiary seen
   state.
6. Open `poki-wild-battle.ce` above the dialog with the lead party
   creature and target as cropped idle-sprite cards, HP bars, type labels,
   and the target health tone from `formatWildCombatPrompt`.
7. Offer `utala / poki / ijo / tawa` through the dialog choices.
8. On `utala`: calculate type-scaled damage from the lead party creature,
   reduce target HP without killing below 1 HP, update the wild-battle
   target HP bar, show a `-N HP` damage popup with `pona mute` / `awen`
   / `pona` / `pakala` tone, and return to the action menu.
9. On `ijo`: list available healing items, consume one if used, heal the
   lead creature and persisted party HP, then return to the action menu.
10. On `tawa`: log outcome `fled` to `encounter_log`, exit.
11. On `poki`: consume the strongest carried poki item, calculate HP-scaled catch chance via
    `wildCatchChance()`, render the wild-battle capture overlay as
    `poki li tawa`, then resolve:

-   Success → `addToParty(species_id, level)` if a slot is open,
    record bestiary caught state, roll species item drops, grant half
    `xp_yield` to the lead party creature, log `caught`, show
    `poki li awen`, play the configured caught dialog.
-   Failure → log `escaped`, show `soweli li weka`, play the configured
    escaped dialog.
-   Full party → no roster mutation; treat as unresolved/fled for log
    purposes, show `soweli li weka`, and play the configured escaped
    dialog.

### Dialog

Every user-facing string routes through
`src/content/spine/dialog/<id>.json` and resolves via Tatoeba at
`pnpm build-spine`. The active system dialog IDs are authored in
`src/content/gameplay/ui.json` and currently point to:

-   `wild_encounter_appear` — pre-choice prompt
-   `wild_encounter_caught` — success branch
-   `wild_encounter_escaped` — failure branch

Per project rules, hand-authoring TP in encounter code is forbidden.
If a new line is needed, author EN in a new dialog JSON file and run
`pnpm validate-tp`.

### Persistence

-   **Capacitor Preferences** — journey beat and current-map pointers are
    updated outside the encounter itself through the normal runtime state
    and save strategy.
-   **SQLite** backs this loop:
    -   `party_roster` stores slot, species, level, XP, and current HP.
    -   `inventory` stores `poki_lili`, `kili`, `ma`, and drops.
    -   `bestiary_seen` / `bestiary_caught` state updates on encounter
        appearance and successful catch.
    -   `encounter_log` records every fled/caught/escaped event.

### What loop (1) intentionally does NOT do

-   Full bespoke party-creature battle arena. Captured creatures influence
    wild damage through lead type/stats and receive XP, and set-piece
    action-battle fights now swap the player body/stats to the lead
    creature, but wild fights still use the dialog + overlay flow rather
    than a separate creature-arena scene.
-   Full party-creature attack animation in wild encounters. The current
    wild overlay proves lead/target identity, HP changes, damage popups,
    and the `poki` throw / caught / escaped feedback, but the `utala` hit
    is still a damage popup plus HP update rather than a bespoke
    creature-stage attack.
-   Full runtime UI integration for evolutions, daycare breeding, rematches,
    and NG+ depth. The current status-effect, daycare, rematch, and NG+
    helpers are pure and JSON-backed, but the wild encounter menu does not
    yet surface a full party-command/status-management loop.

## Action-battle set-pieces

Designated fights, one per journey beat 2+:

| Beat | NPC          | Role           | Stats (current)                                                                                                      | Flag on defeat                          |
| ---- | ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 2    | `jan_ike`    | rival          | HP 60, ATK 14, PDEF 8, `EnemyType.Aggressive`                                                                        | `jan_ike_defeated`                      |
| 3    | `jan_wawa`   | first jan lawa | HP 60 → 80, ATK 16 → 20, PDEF 10 → 14, `Aggressive` → `Tank`                                                         | `badge_sewi`                            |
| 4    | `jan_telo`   | jan lawa       | HP 80 → 100, ATK 20 → 24, PDEF 12 → 16, `Defensive`                                                                  | `badge_telo`                            |
| 5    | `jan_lete`   | jan lawa       | HP 90 → 120, ATK 22 → 30, PDEF 14 → 20, `Ranged` → `Tank`                                                            | `badge_lete`                            |
| 6    | `jan_suli`   | jan lawa       | HP 110 → 140, ATK 28 → 36, PDEF 18 → 22, `Aggressive` → `Berserker`                                                  | `badge_suli`                            |
| 7    | green dragon | endgame boss   | Configured in `src/content/gameplay/trainers.json`: HP 320, ATK 42, PDEF 28, `Berserker`, dedicated defeat animation | `green_dragon_defeated`, `game_cleared` |

### Wiring

1. **Provider** — `provideActionBattle()` is registered in both
   `src/server.ts` and `src/config/config.client.ts`. Registering the
   server provider enables hit resolution and AI state; registering the
   client provider renders the hotbar and attack hitboxes.

2. **Event factory** — `src/modules/main/jan-ike.ts` exports `JanIke()`
   and consumes `TRAINER_BATTLE_CONFIGS.jan_ike`. Graphic, HP, ATK, PDEF,
   AI tuning, coin reward key, faint animation, victory dialog base, and
   next journey beat are authored in `src/content/gameplay/trainers.json`;
   the defeat SFX cue is selected through `src/content/gameplay/audio.json`.
   `GymLeader()` follows the same normalized config shape for all four
   jan lawa, with optional phase-2 tuning.

3. **Registration** — `JanIke()`, four `GymLeader()` instances, and
   `GreenDragon()` are attached to their maps in
   `src/modules/main/server.ts`, with placement resolved by
   `runtime-map-events.ts` from compiled TMJ objects in `world.json`.
   Rival/jan lawa stats, rewards, action-battle tuning, phase-two config,
   green-dragon config, and defeat visuals come from
   `src/content/gameplay/trainers.json`.

4. **Dialog** — two Tatoeba-gated dialog nodes:

    - `jan_ike_intro` (fires on `onAction` while flag unset)
    - `jan_ike_victory` (fires from the `onDefeated` callback and on
      `onAction` after defeat)

5. **Flag propagation** — `setFlag(...)` writes to the `flags` SQLite
   table. Warps read those flags through `Warp({ requiredFlag })` to gate
   the next region. The green-dragon trigger uses `allBadgesEarned()`.

6. **Rewards and persistence** — rival/jan lawa/final wins grant XP and/or
   `ma`, record mastered words, cue SFX/BGM, emit XP/level-up/new-move
   notifications through `awardLeadVictoryXp()`, advance `KEYS.journeyBeat`,
   and best-effort autosave slot 0 after combat end.

7. **Lead battle avatar** — `src/modules/main/lead-battle-avatar.ts`
   resolves `party_roster[0]`, looks up the generated species stats, and
   syncs the server player into `species_<id>` with lead HP, SP, ATK,
   PDEF, and move bar state for action-battle set-pieces. Jan Ike, jan
   lawa, and green dragon intros call `activateLeadBattleAvatar`;
   victory/full-party defeat, disconnect, and map-join paths call
   `restoreLeadBattleAvatar` so the field returns to the `hero` sprite
   while persisted lead HP stays current. If the active battle lead
   faints and a bench creature still has HP, `onDead` persists the
   fainted lead at 0 HP, promotes the next conscious creature, and
   reopens the same battle body/stats/move bar bridge instead of
   respawning.

8. **Lead move skills** — `src/modules/main/lead-battle-skills.ts`
   projects every generated move into an RPG.js skill entry under
   `LEAD_ACTION_BATTLE_SKILL_DATABASE`, registers that database in
   `src/modules/main/server.ts`, builds the current lead species learnset
   into a stable move bar model, and opens `poki-lead-movebar.ce`
   during set-piece combat. The move bar shows up to four lead moves,
   a target/range status pill, SP cost, type/power metadata, range, and
   cooldown state, plus a persistent bench switch row when the party has
   conscious non-lead creatures. Tapping a ready move applies the
   registered skill through RPG.js's damage formula to the nearest live
   BattleAi target without mutating `player.skills` (RPG.js beta
   currently hydrates learned skill arrays through transient null slots
   in the browser client). `tests/e2e/full/action-battle-lead-movebar.spec.ts`
   proves the real mobile browser path: an iPhone-viewport move bar shows
   the live jan Ike target, exposes 44px+ tap targets, switches to a
   caught bench creature, receives a move tap, spends lead SP, damages
   live jan Ike HP, remounts with cooldown/ARIA state in the DOM, and
   attaches `mobile-combat-target-reticle.png` for the single-target
   cyan reticle. Current limits: no richer full-party battle command
   flow beyond direct lead switching, and no explicit multi-target
   selector for future multi-enemy set-pieces.

9. **Combat chrome and visuals** — `src/modules/main/combat-chrome.ts`
   owns the shared HP-bar, hit-feedback, and reticle view models used by
   the CanvasEngine overlays. `src/modules/main/combat-visuals.ts` owns
   body-level presentation on top of action-battle's native damage
   flash/knockback: HP drops play the combatant `hurt` strip, defeated
   set-piece events emit `poki-combat-faint.ce` as a body-clone
   fade/drop before action-battle removes the original event, configured
   rival/jan lawa/final events render `poki-combat-target-reticle.ce`
   around the target sprite from JSON-backed reticle geometry/colors,
   and the green dragon routes that channel to the dedicated
   `green_dragon_death` spritesheet.

### What the action-battle module provides

-   `provideActionBattle(options?)` — wires the module on client + server
-   `BattleAi(event, { enemyType, onDefeated, ... })` — AI controller
    attached in `onInit`. Handles vision, chase, attack cadence.
-   `EnemyType` enum: `Aggressive | Defensive | Ranged | Tank | Berserker`
-   `DEFAULT_PLAYER_ATTACK_HITBOXES` — direction-aware melee hitboxes;
    the active lead creature avatar uses these through the player entity
    when the action-battle provider is active.

### Jan lawa factory behavior

`GymLeader()` handles all four current jan lawa. It sets phase-1 stats,
attaches `BattleAi`, optionally performs a phase-2 HP/stat/AI swap,
sets the badge flag on defeat, records the reward word, grants `ma`,
awards lead-party XP, plays victory dialog, advances the journey beat,
and autosaves. Current phase transition detection is polling-based
because the upstream action-battle module does not expose a public
per-event damage hook.

### Loss / retry behavior

When the player's HP hits 0 RPG.js fires `onDead(player)`, which we
hook in `src/modules/main/player.ts`. The handler delegates to
`respawnAtLastSafeMap` in `src/modules/main/respawn.ts`:

1. Read `KEYS.lastSafeMapId` + `lastSafeSpawnX/Y` from Capacitor
   Preferences. If unset (first run, fresh boot), fall back to
   `ma_tomo_lili` at [128, 128].
2. In browser runtime, open the `poki-defeat-screen` CanvasEngine GUI
   with `pakala! sina tawa ma tomo.` and safe-village destination copy.
   The Vitest integration fixture no-ops this GUI layer so it can test
   the engine respawn path without a browser GUI registry.
3. Play the configured revive dialog node, currently `game_over_revive`.
   Kid-friendly tone — "You seem well..." rather than a punishment prompt.
4. Restore `player.hp = player.param.maxhp` so the player wakes at
   full HP.
5. `changeMap` to the safe location.

The respawn anchor is updated whenever the player warps into a
village (`markSafeMapIfVillage` called from `Warp.onPlayerTouch`).
The current safe-village roster is `ma_tomo_lili`, `ma_telo`,
and `ma_lete`. Routes and jan lawa challenge maps are NOT safe maps, so a loss rolls the
player back to the last town they rested in, which also encodes the
save-progress metaphor.

**What we deliberately don't do:**

-   No permadeath, ever. Party roster is preserved across a loss
    (kid audience — losing a caught creature would feel terrible).
-   No XP penalty / gold loss. Loss is a setback, not a punishment.
-   No game-over menu or retry/load prompt. The transition is branded
    defeat overlay → revive dialog → safe-village map-change, and play
    resumes.
