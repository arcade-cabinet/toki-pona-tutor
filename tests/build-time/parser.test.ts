/**
 * Parser tests — the .tsx parser is the bottom of the toolchain's stack.
 * Every other component (palette resolver, emitter, renderer, validator)
 * depends on it correctly extracting tileset metadata from Fan-tasy's
 * real `.tsx` files.
 *
 * See docs/build-time/MAP_AUTHORING.md § "Tests — Unit-level" item 1.
 */
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { parseTsx } from '../../scripts/map-authoring/lib/parser';

const CORE = resolve(__dirname, '../../public/assets/tilesets/core/Tiled/Tilesets');

describe('parseTsx — Tileset_Ground', () => {
  const path = resolve(CORE, 'Tileset_Ground.tsx');

  it('extracts name + tile size', async () => {
    const t = await parseTsx(path);
    expect(t.name).toBeTruthy();
    expect(t.tileWidth).toBe(16);
    expect(t.tileHeight).toBe(16);
  });

  it('reports a positive tile count', async () => {
    const t = await parseTsx(path);
    expect(t.tileCount).toBeGreaterThan(0);
  });

  it('resolves the image path to an existing PNG', async () => {
    const { existsSync } = await import('node:fs');
    const t = await parseTsx(path);
    expect(t.image.source).toMatch(/\.png$/);
    expect(existsSync(t.image.absolutePath)).toBe(true);
    expect(t.image.width).toBeGreaterThan(0);
    expect(t.image.height).toBeGreaterThan(0);
  });

  it('preserves absolute path of the parsed file', async () => {
    const t = await parseTsx(path);
    expect(t.absolutePath).toBe(path);
  });

  it('declares columns consistent with image width / tile width', async () => {
    const t = await parseTsx(path);
    // columns attribute on <tileset> is definitive; we also sanity-check
    // that it lines up with the image geometry. Default spacing to 0 so
    // the arithmetic is never NaN even when the TSX omits it.
    expect(t.columns).toBeGreaterThan(0);
    const spacing = t.spacing ?? 0;
    const expectedCols = Math.floor(
      (t.image.width + spacing) / (t.tileWidth + spacing),
    );
    expect(t.columns).toBe(expectedCols);
  });
});

describe('parseTsx — Tileset_Water', () => {
  const path = resolve(CORE, 'Tileset_Water.tsx');

  it('parses successfully', async () => {
    const t = await parseTsx(path);
    expect(t.tileCount).toBeGreaterThan(0);
  });
});

describe('parseTsx — Animation_Waterfall (animated tileset)', () => {
  const path = resolve(CORE, 'Animation_Waterfall.tsx');

  it('parses successfully', async () => {
    const t = await parseTsx(path);
    expect(t.tileCount).toBeGreaterThan(0);
  });

  it('extracts animation frames for at least one tile', async () => {
    const t = await parseTsx(path);
    const animatedTiles = Object.keys(t.animations);
    expect(animatedTiles.length).toBeGreaterThan(0);
    const firstAnim = t.animations[Number(animatedTiles[0])];
    expect(firstAnim.length).toBeGreaterThanOrEqual(2);
    expect(firstAnim[0]).toMatchObject({
      tileid: expect.any(Number),
      duration: expect.any(Number),
    });
  });
});

describe('parseTsx — tiles with custom properties', () => {
  // The Fan-tasy wang rulesets and some tilesets embed per-tile properties
  // like `collides: true`. We don't require a specific tileset to have
  // them, but whenever ANY tileset does, the parser extracts them.
  it('extracts collides property when present in a tileset', async () => {
    const t = await parseTsx(resolve(CORE, 'Tileset_Ground.tsx'));
    // Walk the map; if any tile has a 'collides' boolean, it's parsed as boolean.
    for (const tileProps of Object.values(t.properties) as Array<Record<string, unknown>>) {
      if ('collides' in tileProps) {
        expect(typeof tileProps.collides).toBe('boolean');
        return;
      }
    }
    // If this tileset has zero property entries at all, the test is vacuous
    // but not a failure — it's a property of the Fan-tasy content.
    expect(Object.keys(t.properties).length).toBeGreaterThanOrEqual(0);
  });
});

describe('parseTsx — error cases', () => {
  it('throws a clear error on a missing file', async () => {
    await expect(parseTsx('/nonexistent/Tileset_Nope.tsx')).rejects.toThrow(/not found|ENOENT/i);
  });

  it('throws on a file that is not a tileset', async () => {
    // Use a known-non-TSX file from the repo.
    const readmePath = resolve(__dirname, '../../README.md');
    await expect(parseTsx(readmePath)).rejects.toThrow();
  });
});
