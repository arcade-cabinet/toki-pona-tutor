/**
 * Tiled layer + object name enums for the Stage-0-emitted .tmj files.
 *
 * The map-authoring toolchain (scripts/map-authoring/) emits exactly
 * these layer names; runtime scenes look them up by name to wire
 * collisions, depths, and object handlers. If a spec adds a new layer
 * or object type, declare it here so it can't be referenced by typo.
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
