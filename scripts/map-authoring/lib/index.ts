/**
 * Public surface of the map-authoring toolchain.
 *
 * CLI entry points import from here; tests mostly import individual files.
 * Also the `defineMap` + `paint` helpers authors use in spec files.
 */
export { parseTsx } from "./parser";
export { assignFirstGids, resolvePaletteName, tsxQualifiedKey, tsxStem } from "./palette";
export { emitTmj } from "./emitter";
export { emitTmx } from "./tmx-emitter";
export { renderTmj, type RenderOptions } from "./renderer";
export { validateSpec, type SpeciesLookup } from "./validator";
export {
    classifyPaletteEntry,
    isActorSurface,
    isEncounterSurface,
    tileHasCollision,
    tilesetForPaletteEntry,
    wangBridgeCandidatesForTileset,
    wangColorNamesForTile,
    type PaletteSemantic,
    type WangBridgeCandidate,
} from "./semantics";
export type {
    AnimationFrame,
    EncounterZone,
    MapSpec,
    ObjectMarker,
    Palette,
    PaletteEntry,
    PaletteRole,
    PaletteSurface,
    ParsedPoint,
    ParsedTileset,
    ParsedTileObject,
    ParsedWangColor,
    ParsedWangset,
    ParsedWangTile,
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
} from "./types";
export {
    defineMap,
    edgeTransitionTiles,
    paint,
    paintEdgeTransitions,
    paintNeighborBuffer,
    paintRect,
    type EdgeTransitionKey,
    type EdgeTransitionRule,
    type NeighborBufferRule,
} from "./spec-helpers";
export { loadTilesetsForSpec } from "./loader";
