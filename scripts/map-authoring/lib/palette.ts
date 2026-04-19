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
 * each subsequent tileset starts at `previous.firstgid + previous.tileCount`.
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
    const key = tsxStem(ts);
    if (m.has(key)) {
      throw new Error(
        `assignFirstGids: duplicate tileset stem "${key}" (tilesets with the same .tsx filename cannot coexist in one map). First seen at firstgid=${m.get(key)}; duplicate at ${ts.absolutePath}`,
      );
    }
    m.set(key, cursor);
    cursor += ts.tileCount;
  }
  return m;
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

  const tileset = tilesets.find((t) => tsxStem(t) === entry.tsx);
  if (!tileset) {
    throw new Error(
      `palette: entry "${name}" references tileset "${entry.tsx}" but it is not in the loaded tilesets list`,
    );
  }

  if (entry.local_id < 0 || entry.local_id >= tileset.tileCount) {
    throw new Error(
      `palette: entry "${name}" has local_id ${entry.local_id} out of range [0, ${tileset.tileCount})`,
    );
  }

  return firstgid + entry.local_id;
}

/** Derive the `tsx` stem from a ParsedTileset. Platform-agnostic: uses
 *  node:path so it works on POSIX (/) and Windows (\) path separators. */
import { basename } from 'node:path';
export function tsxStem(ts: ParsedTileset): string {
  return basename(ts.absolutePath, '.tsx');
}
