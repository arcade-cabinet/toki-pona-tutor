/**
 * Palette resolver: names → global tile IDs.
 *
 * The MapSpec author writes `grass`, `water`, `house_red` — palette entries
 * that point to a specific tile in a specific tileset. At emit time we need
 * the absolute GID Tiled uses: `firstgid + local_id` of the owning tileset.
 *
 * See docs/build-time/MAP_AUTHORING.md § "Palette format" and § "The TMJ emitter".
 */
import type { Palette, ParsedTileset } from './types';

/** Map of tileset `name` (i.e. the `.tsx` filename without extension) → firstgid. */
export type FirstGidMap = Map<string, number>;

/**
 * Assign firstgid values to tilesets in the order given. First tileset gets 1;
 * each subsequent tileset starts at `previous.firstgid + gidSpan(previous)`.
 * The tileset's key in the returned map is its `.tsx` filename stem (matches
 * `PaletteEntry.tsx`).
 *
 * Tileset order is defined by the caller — usually alphabetical by name within
 * a map, so emitter output is deterministic (see emitter tests).
 */
export function assignFirstGids(tilesets: ParsedTileset[]): FirstGidMap {
  const m: FirstGidMap = new Map();
  let cursor = 1;
  for (const ts of tilesets) {
    // Register both the bare stem and the pack-qualified key so palette
    // entries can reference either. On duplicate bare stems (Tileset_Ground
    // in both core/ and desert/), the bare stem remains pointing at the first
    // registered tileset — palette authors should use the qualified key in
    // that case; the loader already validates that specs don't use ambiguous
    // bare refs, so this is safe.
    const bare = tsxStem(ts);
    const qualified = tsxQualifiedKey(ts);
    if (m.has(qualified)) {
      throw new Error(
        `assignFirstGids: duplicate tileset "${qualified}" — tilesets with identical pack+stem cannot coexist in one map. First at firstgid=${m.get(qualified)}, duplicate at ${ts.absolutePath}`,
      );
    }
    m.set(qualified, cursor);
    // Only register the bare stem if not already taken, so the first-seen
    // tileset wins the bare-name slot. Qualified key always works.
    if (!m.has(bare)) m.set(bare, cursor);
    cursor += tilesetGidSpan(ts);
  }
  return m;
}

export function tilesetGidSpan(ts: ParsedTileset): number {
  const sparseIds = [
    ...Object.keys(ts.perTileImages),
    ...Object.keys(ts.properties),
    ...Object.keys(ts.animations),
  ].map((id) => Number(id)).filter((id) => Number.isInteger(id) && id >= 0);
  const maxSparseId = sparseIds.length > 0 ? Math.max(...sparseIds) : -1;
  return Math.max(ts.tileCount, maxSparseId + 1);
}

export function hasLocalTileId(ts: ParsedTileset, localId: number): boolean {
  if (!Number.isInteger(localId) || localId < 0) return false;
  if (ts.isCollection) return ts.perTileImages[localId] != null;
  return localId < tilesetGidSpan(ts);
}

/**
 * Resolve a palette name to the absolute GID used in TMJ tile data.
 * Throws on any lookup failure — these are author errors, not runtime conditions.
 */
export function resolvePaletteName(
  palette: Palette,
  firstGids: FirstGidMap,
  tilesets: ParsedTileset[],
  name: string,
): number {
  const entry = palette[name];
  if (!entry) {
    throw new Error(`palette: unknown name "${name}" (not in palette)`);
  }

  const firstgid = firstGids.get(entry.tsx);
  if (firstgid == null) {
    throw new Error(
      `palette: entry "${name}" references tileset "${entry.tsx}" but that tileset is not loaded for this map`,
    );
  }

  // Find the tileset whose qualified key OR bare stem matches entry.tsx.
  // Supports both "Tileset_Ground" and "core/Tileset_Ground" palette refs.
  const tileset = tilesets.find(
    (t) => tsxQualifiedKey(t) === entry.tsx || tsxStem(t) === entry.tsx,
  );
  if (!tileset) {
    throw new Error(
      `palette: entry "${name}" references tileset "${entry.tsx}" but it is not in the loaded tilesets list`,
    );
  }

  if (!hasLocalTileId(tileset, entry.local_id)) {
    throw new Error(
      `palette: entry "${name}" has local_id ${entry.local_id} out of range for tileset "${entry.tsx}"`,
    );
  }

  return firstgid + entry.local_id;
}

/**
 * Derive the `tsx` stem from a ParsedTileset. Platform-agnostic: uses
 * node:path so it works on POSIX (/) and Windows (\) path separators.
 */
import { basename, sep } from 'node:path';
export function tsxStem(ts: ParsedTileset): string {
  return basename(ts.absolutePath, '.tsx');
}

/**
 * Derive the pack-qualified tsx key from a ParsedTileset, e.g.
 * "core/Tileset_Ground". Used when palette entries disambiguate by pack
 * (needed because some tileset stems like `Tileset_Ground` exist in more
 * than one pack). Falls back to the bare stem when the absolutePath
 * doesn't follow the pack/Tiled/Tilesets/foo.tsx layout.
 */
export function tsxQualifiedKey(ts: ParsedTileset): string {
  const name = basename(ts.absolutePath, '.tsx');
  const parts = ts.absolutePath.split(sep);
  const tilesetsIdx = parts.lastIndexOf('Tilesets');
  if (tilesetsIdx >= 3 && parts[tilesetsIdx - 1] === 'Tiled') {
    const pack = parts[tilesetsIdx - 2];
    return `${pack}/${name}`;
  }
  return name;
}
