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
  const packs = existsSync(tilesetsRoot)
    ? (await readdir(tilesetsRoot)).filter((d) => !d.startsWith('.'))
    : [];

  const loaded: ParsedTileset[] = [];
  for (const tsxName of spec.tilesets) {
    let found: string | undefined;
    for (const pack of packs) {
      const candidate = join(
        tilesetsRoot,
        pack,
        'Tiled',
        'Tilesets',
        `${tsxName}.tsx`,
      );
      if (existsSync(candidate)) {
        found = candidate;
        break;
      }
    }
    if (!found) {
      throw new Error(
        `loader: tileset "${tsxName}" not found in any pack under ${tilesetsRoot}`,
      );
    }
    loaded.push(await parseTsx(found));
  }
  return loaded;
}
