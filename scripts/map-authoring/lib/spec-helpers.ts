/**
 * Ergonomics for authoring specs.
 *
 * `defineMap(obj)` is identity-plus-typecheck so specs get good editor
 * feedback. `paint` is a tagged template for compact tile grids.
 */
import type { MapSpec, TileGrid } from "./types";

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
export function paint(
    strings: TemplateStringsArray,
    ...values: unknown[]
): {
    grid(): TileGrid;
} {
    let text = "";
    for (let i = 0; i < strings.length; i++) {
        text += strings[i];
        if (i < values.length) text += String(values[i]);
    }
    return {
        grid(): TileGrid {
            return text
                .split("\n")
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

export function emptyGrid(width: number, height: number): string[][] {
    return Array.from({ length: height }, () => Array.from({ length: width }, () => "."));
}

export type EdgeTransitionKey = "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

export interface EdgeTransitionRule {
    /** Palette names eligible to be replaced by transition tiles. */
    base: string | string[];
    /** Neighbor palette names that should pull a transition toward themselves. */
    neighbors: string | string[];
    /** Transition palette entries keyed by neighbor direction around the base cell. */
    transitions: Partial<Record<EdgeTransitionKey, string>>;
}

export interface NeighborBufferRule {
    /** Palette names eligible to be replaced with the buffer tile. */
    base: string | string[];
    /** Neighbor palette names that should attract the buffer tile. */
    neighbors: string | string[];
    /** Palette name to write into eligible cells adjacent to a neighbor. */
    buffer: string;
}

/**
 * Paint a one-tile buffer around a terrain family.
 *
 * This is intentionally simpler than a general autotiler: it only replaces
 * eligible base cells when the original source grid has a cardinal neighbor.
 */
export function paintNeighborBuffer(grid: string[][], rule: NeighborBufferRule): void {
    const base = asSet(rule.base);
    const neighbors = asSet(rule.neighbors);
    const snapshot = grid.map((row) => [...row]);

    for (let y = 0; y < snapshot.length; y++) {
        for (let x = 0; x < snapshot[y].length; x++) {
            if (!base.has(snapshot[y][x])) continue;
            if (hasCardinalNeighbor(snapshot, x, y, neighbors)) {
                grid[y][x] = rule.buffer;
            }
        }
    }
}

/**
 * Paint transition tiles around a surface without guessing at runtime.
 *
 * The function reads from a snapshot of the grid and writes to the original,
 * which prevents a newly-painted transition from cascading into its neighbors.
 * Direction keys describe where the neighbor is relative to the base cell.
 */
export function paintEdgeTransitions(grid: string[][], rule: EdgeTransitionRule): void {
    const base = asSet(rule.base);
    const neighbors = asSet(rule.neighbors);
    const snapshot = grid.map((row) => [...row]);

    for (let y = 0; y < snapshot.length; y++) {
        for (let x = 0; x < snapshot[y].length; x++) {
            if (!base.has(snapshot[y][x])) continue;
            const key = edgeTransitionKey(snapshot, x, y, neighbors);
            if (!key) continue;
            const transition = rule.transitions[key];
            if (transition) grid[y][x] = transition;
        }
    }
}

export function edgeTransitionTiles(prefix: string): Record<EdgeTransitionKey, string> {
    return {
        n: `${prefix}_n`,
        e: `${prefix}_e`,
        s: `${prefix}_s`,
        w: `${prefix}_w`,
        ne: `${prefix}_ne`,
        nw: `${prefix}_nw`,
        se: `${prefix}_se`,
        sw: `${prefix}_sw`,
    };
}

function edgeTransitionKey(
    grid: string[][],
    x: number,
    y: number,
    neighbors: Set<string>,
): EdgeTransitionKey | null {
    const n = neighbors.has(grid[y - 1]?.[x]);
    const e = neighbors.has(grid[y]?.[x + 1]);
    const s = neighbors.has(grid[y + 1]?.[x]);
    const w = neighbors.has(grid[y]?.[x - 1]);
    const count = Number(n) + Number(e) + Number(s) + Number(w);
    if (count === 0 || count > 2) return null;
    if (count === 1) {
        if (n) return "n";
        if (e) return "e";
        if (s) return "s";
        return "w";
    }
    if (n && e) return "ne";
    if (n && w) return "nw";
    if (s && e) return "se";
    if (s && w) return "sw";
    return null;
}

function hasCardinalNeighbor(
    grid: string[][],
    x: number,
    y: number,
    neighbors: Set<string>,
): boolean {
    return (
        neighbors.has(grid[y - 1]?.[x]) ||
        neighbors.has(grid[y]?.[x + 1]) ||
        neighbors.has(grid[y + 1]?.[x]) ||
        neighbors.has(grid[y]?.[x - 1])
    );
}

function asSet(value: string | string[]): Set<string> {
    return new Set(Array.isArray(value) ? value : [value]);
}
