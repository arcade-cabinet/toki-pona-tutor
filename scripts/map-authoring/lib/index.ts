/**
 * Public surface of the map-authoring toolchain.
 *
 * CLI entry points import from here; tests mostly import individual files.
 * Also the `defineMap` + `paint` helpers authors use in spec files.
 */
export { parseTsx } from './parser';
export { assignFirstGids, resolvePaletteName, tsxStem } from './palette';
export { emitTmj } from './emitter';
export { renderTmj, type RenderOptions } from './renderer';
export { validateSpec, type SpeciesLookup } from './validator';
export type {
  AnimationFrame,
  EncounterZone,
  MapSpec,
  ObjectMarker,
  Palette,
  PaletteEntry,
  ParsedTileset,
  PlacedTile,
  PropertyValue,
  TileGrid,
  TmjLayer,
  TmjMap,
  TmjObject,
  TmjObjectLayer,
  TmjProperty,
  TmjTileLayer,
  TmjTilesetRef,
  ValidationIssue,
  ValidationReport,
} from './types';
export { defineMap, paint } from './spec-helpers';
export { loadTilesetsForSpec } from './loader';
