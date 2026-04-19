/**
 * Convenience loader: given a spec, find and parse every `.tsx` the spec
 * declares by walking public/assets/tilesets/<pack>/Tiled/Tilesets/.
 *
 * The pack is inferred by searching every pack dir for a matching .tsx
 * file. Fan-tasy pack stems are stable (`core`, `seasons`, `snow`,
 * `desert`, `fortress`, `indoor`) so this is a small fixed-cost search.
 */
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MapSpec, ParsedTileset } from './types';
import { parseTsx } from './parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKTREE_ROOT = resolve(__dirname, '..', '..', '..');

export async function loadTilesetsForSpec(
  spec: MapSpec,
  workspaceRoot: string = WORKTREE_ROOT,
): Promise<ParsedTileset[]> {
  const tilesetsRoot = join(workspaceRoot, 'public', 'assets', 'tilesets');
  // Sort packs so tileset resolution is deterministic across OS / filesystem
  // orderings. Without this, readdir() can return packs in arbitrary order
  // and the "first match wins" behavior becomes flaky.
  const packs = existsSync(tilesetsRoot)
    ? (await readdir(tilesetsRoot))
        .filter((d) => !d.startsWith('.'))
        .sort()
    : [];

  const loaded: ParsedTileset[] = [];
  for (const ref of spec.tilesets) {
    // A tileset reference can be qualified ("core/Tileset_Ground") or bare
    // ("Tileset_Ground"). Qualified refs always win; bare refs that match
    // more than one pack error out so authors disambiguate deliberately.
    const [qualPack, qualName] = ref.includes('/')
      ? ref.split('/', 2)
      : [undefined, ref];
    const name = qualName!;

    const matches: string[] = [];
    if (qualPack) {
      const candidate = join(tilesetsRoot, qualPack, 'Tiled', 'Tilesets', `${name}.tsx`);
      if (existsSync(candidate)) matches.push(candidate);
    } else {
      for (const pack of packs) {
        const candidate = join(tilesetsRoot, pack, 'Tiled', 'Tilesets', `${name}.tsx`);
        if (existsSync(candidate)) matches.push(candidate);
      }
    }
    if (matches.length === 0) {
      throw new Error(
        qualPack
          ? `loader: tileset "${ref}" not found at ${tilesetsRoot}/${qualPack}/Tiled/Tilesets/${name}.tsx`
          : `loader: tileset "${ref}" not found in any pack under ${tilesetsRoot}`,
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `loader: tileset "${ref}" found in ${matches.length} packs ` +
          `(${matches.join(', ')}); qualify with <pack>/<name> ` +
          `(e.g. "core/${name}") or remove duplicates`,
      );
    }
    loaded.push(await parseTsx(matches[0]));
  }
  return loaded;
}
