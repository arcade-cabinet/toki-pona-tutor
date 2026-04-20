/**
 * runtime-contract pin test.
 *
 * `src/game/constants/tilemap.ts` and
 * `scripts/map-authoring/lib/runtime-contract.ts` define the same two
 * enums (TilemapLayer + TilemapObject). The two tsconfigs can't cross-
 * import (src/ and scripts/ are scoped separately), so the enums have
 * to be duplicated. This test parses both files and asserts that the
 * enum entries match exactly — if you edit one without the other, the
 * fail message tells you which is out of sync.
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

const RUNTIME_PATH = resolve(ROOT, 'src/game/constants/tilemap.ts');
const SPEC_PATH = resolve(ROOT, 'scripts/map-authoring/lib/runtime-contract.ts');

/**
 * Extract `name = "value"` entries from a single `enum Foo { ... }`
 * block. Returns a Map<entryName, stringValue>.
 *
 * Deliberately small + dependency-free — this is a guard test, not a
 * full TS parser; the input files are hand-maintained and stable.
 */
function parseEnum(source: string, enumName: string): Map<string, string> {
  const re = new RegExp(`enum\\s+${enumName}\\s*\\{([^}]+)\\}`, 'm');
  const match = source.match(re);
  if (!match) throw new Error(`enum ${enumName} not found in source`);
  const body = match[1];
  const entries = new Map<string, string>();
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*['"]([^'"]+)['"]/);
    if (m) entries.set(m[1], m[2]);
  }
  return entries;
}

describe('runtime-contract pin', () => {
  it('TilemapLayer enums match between src/ and scripts/', async () => {
    const runtime = parseEnum(await readFile(RUNTIME_PATH, 'utf-8'), 'TilemapLayer');
    const spec = parseEnum(await readFile(SPEC_PATH, 'utf-8'), 'TilemapLayer');
    expect(Object.fromEntries(runtime)).toEqual(Object.fromEntries(spec));
  });

  it('TilemapObject enums match between src/ and scripts/', async () => {
    const runtime = parseEnum(await readFile(RUNTIME_PATH, 'utf-8'), 'TilemapObject');
    const spec = parseEnum(await readFile(SPEC_PATH, 'utf-8'), 'TilemapObject');
    expect(Object.fromEntries(runtime)).toEqual(Object.fromEntries(spec));
  });
});
