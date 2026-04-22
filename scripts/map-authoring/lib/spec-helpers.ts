/**
 * Ergonomics for authoring specs.
 *
 * `defineMap(obj)` is identity-plus-typecheck so specs get good editor
 * feedback. `paint` is a tagged template for compact tile grids.
 */
import type { MapSpec, TileGrid } from './types';

export function defineMap<T extends MapSpec>(spec: T): T {
  return spec;
}

/**
 * Tagged template for authoring tile grids.
 *
 * Usage:
 *   paint`
 *     g g g g g
 *     g . . . g
 *     g . . . g
 *     g g g g g
 *   `.grid()
 *
 * Rules:
 *  - whitespace separates cells (any amount of spaces or tabs between)
 *  - lines that are entirely whitespace are dropped (allows pretty indent)
 *  - lines within a row must contain the same number of cells (enforced
 *    at emit-time, not here — authors see the error from the validator)
 *  - palette names can be 1-char or longer, but must not contain whitespace
 *
 * Returns a `{ grid(): TileGrid }` rather than the grid directly so
 * interpolations like `paint`...${variable}...` could be added later
 * without changing the call site.
 */
export function paint(strings: TemplateStringsArray, ...values: unknown[]): {
  grid(): TileGrid;
} {
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) text += String(values[i]);
  }
  return {
    grid(): TileGrid {
      return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.split(/\s+/));
    },
  };
}

export function paintRect(
  grid: string[][],
  rect: [number, number, number, number],
  tile: string,
): void {
  const [x, y, w, h] = rect;
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      grid[yy][xx] = tile;
    }
  }
}
