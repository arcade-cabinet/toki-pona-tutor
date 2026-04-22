/**
 * Spec validator.
 *
 * Runs before emit. Catches author-side errors: bad palette refs,
 * grid dimension mismatches, missing SpawnPoint, duplicate object names,
 * encounter species not known to the content pipeline.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The validator".
 */
import { isMapBiome, isMapMusicTrack } from '../../../src/content/map-metadata';
import type {
  MapSpec,
  ParsedTileset,
  ValidationIssue,
  ValidationReport,
  TileGrid,
  PlacedTile,
  ObjectMarker,
} from './types';
import { hasLocalTileId, tsxQualifiedKey, tsxStem } from './palette';

/**
 * A lookup function that returns a species record (or null) for a given id.
 * The toolchain doesn't import the content pipeline directly — callers inject
 * this so validator stays decoupled from the game's content loader.
 */
export type SpeciesLookup = (id: string) => unknown | null;

export async function validateSpec(
  spec: MapSpec,
  tilesets: ParsedTileset[],
  speciesLookup: SpeciesLookup,
): Promise<ValidationReport> {
  const issues: ValidationIssue[] = [];

  if (!isMapBiome(spec.biome)) {
    issues.push({
      severity: 'error',
      code: 'invalid_biome',
      message: `spec.biome "${String(spec.biome)}" is not a supported map biome`,
    });
  }
  if (!isMapMusicTrack(spec.music_track)) {
    issues.push({
      severity: 'error',
      code: 'invalid_music_track',
      message: `spec.music_track "${String(spec.music_track)}" is not a supported ambient BGM track`,
    });
  }

  // Index available tilesets under both their bare stem and their
  // pack-qualified key so palette entries using either form resolve.
  const tsByKey = new Map<string, ParsedTileset>();
  for (const t of tilesets) {
    tsByKey.set(tsxQualifiedKey(t), t);
    if (!tsByKey.has(tsxStem(t))) tsByKey.set(tsxStem(t), t);
  }

  // Every tileset the spec declares must be loaded.
  for (const name of spec.tilesets) {
    if (!tsByKey.has(name)) {
      issues.push({
        severity: 'error',
        code: 'tileset_not_loaded',
        message: `tileset "${name}" declared in spec.tilesets but not loaded`,
      });
    }
  }

  // Collect palette names actually USED by any layer. Unused palette entries
  // can legitimately reference tilesets the map doesn't declare (a shared
  // palette file covers many maps); only used entries need to be checked.
  const usedPaletteNames = collectUsedPaletteNames(spec);

  // Check palette references: each USED entry must point at a declared tileset
  // with an in-range local_id.
  for (const name of usedPaletteNames) {
    const entry = spec.palette[name];
    if (!entry) continue; // palette_unknown already reported per cell
    if (!spec.tilesets.includes(entry.tsx)) {
      issues.push({
        severity: 'error',
        code: 'palette_tileset_not_declared',
        message: `palette entry "${name}" (used by map) references tileset "${entry.tsx}" but it is not in spec.tilesets`,
      });
      continue;
    }
    const ts = tsByKey.get(entry.tsx);
    if (!ts) continue; // already reported as tileset_not_loaded
    if (!hasLocalTileId(ts, entry.local_id)) {
      issues.push({
        severity: 'error',
        code: 'palette_local_id_oor',
        message: `palette entry "${name}" has local_id ${entry.local_id} out of range for tileset "${entry.tsx}"`,
      });
    }
  }

  // Check each layer.
  const belowGrid = spec.layers['Below Player'];
  if (!isTileGrid(belowGrid)) {
    issues.push({
      severity: 'error',
      code: 'below_not_grid',
      message: `"Below Player" layer must be a paint grid (got a PlacedTile list)`,
    });
  } else {
    checkGridDims(belowGrid, spec, 'Below Player', issues);
    checkGridPalette(belowGrid, spec, 'Below Player', issues);
  }
  for (const layerName of ['World', 'Above Player'] as const) {
    const content = spec.layers[layerName];
    if (!content) continue;
    if (isTileGrid(content)) {
      checkGridDims(content, spec, layerName, issues);
      checkGridPalette(content, spec, layerName, issues);
    } else {
      checkPlacedTiles(content, spec, layerName, issues);
    }
  }

  // Objects: at least one SpawnPoint, unique names.
  const objects = spec.layers.Objects ?? [];
  const spawnPoints = objects.filter((o) => o.type === 'SpawnPoint');
  if (spawnPoints.length === 0) {
    issues.push({
      severity: 'error',
      code: 'no_spawnpoint',
      message: `no SpawnPoint found — every map must have at least one`,
    });
  }
  const seenNames = new Set<string>();
  for (const o of objects) {
    if (seenNames.has(o.name)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_object_name',
        message: `duplicate object name "${o.name}" in map "${spec.id}"`,
        at: { name: o.name },
      });
    }
    seenNames.add(o.name);
    checkObjectBounds(o, spec, issues);
  }

  // Encounters: each species id must resolve via the provided lookup.
  for (const zone of spec.layers.Encounters ?? []) {
    for (const id of Object.keys(zone.species)) {
      if (speciesLookup(id) == null) {
        issues.push({
          severity: 'error',
          code: 'unknown_species',
          message: `encounter references unknown species "${id}"`,
        });
      }
    }
    if (zone.levelRange[0] > zone.levelRange[1]) {
      issues.push({
        severity: 'error',
        code: 'bad_level_range',
        message: `encounter levelRange min (${zone.levelRange[0]}) > max (${zone.levelRange[1]})`,
      });
    }
  }

  return {
    mapId: spec.id,
    issues,
    ok: !issues.some((i) => i.severity === 'error'),
  };
}

function isTileGrid(x: TileGrid | PlacedTile[] | undefined): x is TileGrid {
  if (!Array.isArray(x) || x.length === 0) return false;
  return Array.isArray(x[0]);
}

function collectUsedPaletteNames(spec: MapSpec): Set<string> {
  const used = new Set<string>();
  for (const layerName of ['Below Player', 'World', 'Above Player'] as const) {
    const content = spec.layers[layerName];
    if (!content) continue;
    if (isTileGrid(content)) {
      for (const row of content) {
        for (const name of row) {
          if (name && name !== '.') used.add(name);
        }
      }
    } else {
      for (const p of content) used.add(p.tile);
    }
  }
  return used;
}

function checkGridDims(
  grid: TileGrid,
  spec: MapSpec,
  layerName: string,
  issues: ValidationIssue[],
): void {
  if (grid.length !== spec.height) {
    issues.push({
      severity: 'error',
      code: 'grid_height_mismatch',
      message: `layer "${layerName}": grid has ${grid.length} rows but map height is ${spec.height}`,
    });
    return;
  }
  for (let y = 0; y < grid.length; y++) {
    if (grid[y].length !== spec.width) {
      issues.push({
        severity: 'error',
        code: 'grid_width_mismatch',
        message: `layer "${layerName}": row ${y} has ${grid[y].length} cells but map width is ${spec.width}`,
        at: { y, layer: layerName },
      });
    }
  }
}

function checkGridPalette(
  grid: TileGrid,
  spec: MapSpec,
  layerName: string,
  issues: ValidationIssue[],
): void {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const name = grid[y][x];
      if (!name || name === '.') continue;
      if (!(name in spec.palette)) {
        issues.push({
          severity: 'error',
          code: 'palette_unknown',
          message: `layer "${layerName}": unknown palette name "${name}" at (${x}, ${y})`,
          at: { x, y, layer: layerName },
        });
      }
    }
  }
}

function checkPlacedTiles(
  placed: PlacedTile[],
  spec: MapSpec,
  layerName: string,
  issues: ValidationIssue[],
): void {
  const used = new Map<string, number>();
  for (let i = 0; i < placed.length; i++) {
    const p = placed[i];
    const [x, y] = p.at;
    if (!(p.tile in spec.palette)) {
      issues.push({
        severity: 'error',
        code: 'palette_unknown',
        message: `layer "${layerName}": place[${i}] uses unknown palette name "${p.tile}"`,
        at: { x, y, layer: layerName },
      });
      continue;
    }
    if (x < 0 || x >= spec.width || y < 0 || y >= spec.height) {
      issues.push({
        severity: 'error',
        code: 'place_out_of_bounds',
        message: `layer "${layerName}": place[${i}] at (${x}, ${y}) is outside map bounds`,
        at: { x, y, layer: layerName },
      });
      continue;
    }
    const key = `${x},${y}`;
    if (used.has(key)) {
      issues.push({
        severity: 'warning',
        code: 'place_overdraw',
        message: `layer "${layerName}": place[${i}] at (${x}, ${y}) overdraws place[${used.get(key)}]`,
        at: { x, y, layer: layerName },
      });
    }
    used.set(key, i);
  }
}

function checkObjectBounds(
  obj: ObjectMarker,
  spec: MapSpec,
  issues: ValidationIssue[],
): void {
  if ('rect' in obj) {
    const [x, y, w, h] = obj.rect;
    if (
      x < 0 || y < 0 ||
      x + w > spec.width || y + h > spec.height ||
      w <= 0 || h <= 0
    ) {
      issues.push({
        severity: 'error',
        code: 'object_rect_out_of_bounds',
        message: `object "${obj.name}" rect [${x},${y},${w},${h}] is out of map bounds [${spec.width} x ${spec.height}]`,
        at: { name: obj.name },
      });
    }
  } else {
    const [x, y] = obj.at;
    if (x < 0 || x >= spec.width || y < 0 || y >= spec.height) {
      issues.push({
        severity: 'error',
        code: 'object_at_out_of_bounds',
        message: `object "${obj.name}" at (${x}, ${y}) is out of map bounds [${spec.width} x ${spec.height}]`,
        at: { name: obj.name },
      });
    }
  }
}
