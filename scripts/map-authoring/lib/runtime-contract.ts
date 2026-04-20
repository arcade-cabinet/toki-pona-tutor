/**
 * Runtime contract — names that BOTH the build-time map-authoring
 * toolchain and the runtime Phaser scenes agree on.
 *
 * Layer + object names are part of the .tmj wire format; if a spec
 * emits "Below Player" but Main.ts looks for "below_player", nothing
 * lines up and the player has no map. Co-locate the strings here so
 * the spec compiler and the scene loader can't drift.
 *
 * The two tsconfigs (src/ and scripts/) can't cross-import, so
 * `src/game/constants/tilemap.ts` mirrors these enums verbatim. The
 * `runtime-contract.test.ts` build-time test pins the two copies
 * together — if you edit one without the other, that test fails.
 */

export enum TilemapLayer {
  BelowPlayer = 'Below Player',
  World = 'World',
  AbovePlayer = 'Above Player',
  Objects = 'Objects',
  Encounters = 'Encounters',
}

export enum TilemapObject {
  SpawnPoint = 'SpawnPoint',
  Sign = 'Sign',
  NPC = 'NPC',
  Warp = 'Warp',
  Trigger = 'Trigger',
}
