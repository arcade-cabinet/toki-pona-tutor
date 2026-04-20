/**
 * Tiled layer + object name enums for the Stage-0-emitted .tmj files.
 *
 * The map-authoring toolchain (scripts/map-authoring/) emits exactly
 * these layer names; runtime scenes look them up by name to wire
 * collisions, depths, and object handlers.
 *
 * IMPORTANT — keep this file in lockstep with
 * `scripts/map-authoring/lib/runtime-contract.ts`. The two trees can't
 * directly cross-import (separate tsconfigs scope src/ vs scripts/), so
 * the strings are duplicated and the build-time tests verify the
 * runtime + spec sides agree (see `tests/build-time/runtime-contract.test.ts`).
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
