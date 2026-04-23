import { describe, expect, it } from "vitest";
import artManifest from "../../src/content/art/tilesets.json";
import maTomoLili from "../../scripts/map-authoring/specs/riverside_home";
import nasinWan from "../../scripts/map-authoring/specs/greenwood_road";
import nasinPiTelo from "../../scripts/map-authoring/specs/rivergate_approach";
import maTelo from "../../scripts/map-authoring/specs/lakehaven";
import maLete from "../../scripts/map-authoring/specs/frostvale";
import nenaSewi from "../../scripts/map-authoring/specs/highridge_pass";
import nenaSuli from "../../scripts/map-authoring/specs/dreadpeak_cavern";
import type {
    MapSpec,
    PaletteEntry,
    PlacedTile,
    TileGrid,
} from "../../scripts/map-authoring/lib/types";

/**
 * T4-08 — surface metadata is authoritative.
 *
 * Every curated tile in `src/content/art/tilesets.json` carries a
 * `surface` (e.g. smooth-grass, dirt-path, deep-water, wall, prop)
 * and a `walkable` boolean. This lint asserts the shape is complete
 * and internally consistent — walls and deep water must never be
 * walkable, grass/dirt/stone paths and ice/snow/sand must always be.
 *
 * It also asserts every tile a shipped map spec uses resolves to a
 * curated entry with a surface declared, so no map can ship with an
 * "unknown" traversability status. This is the v1 guard against
 * accidentally painting a blocker tile onto a walkable route, or the
 * reverse, as the art catalog grows.
 *
 * Salvaged in spirit from closed PR #81 but landed fresh against
 * current main — the runtime data already has the fields; this test
 * keeps them load-bearing.
 */

const SHIPPED_SPECS = [
    maTomoLili,
    nasinWan,
    nenaSewi,
    maTelo,
    maLete,
    nenaSuli,
    nasinPiTelo,
] as const satisfies readonly MapSpec[];

type CuratedTile = {
    id: string;
    surface?: string;
    walkable?: boolean;
    roles?: string[];
};

const tiles = (artManifest.tiles ?? []) as CuratedTile[];
const bySurfaceWalkability = new Map(tiles.map((t) => [t.id, t]));

const WALKABLE_SURFACES = new Set([
    "smooth-grass",
    "rough-grass",
    "dirt-path",
    "stone-path",
    "stone-floor",
    "sand",
    "snow",
    "ice",
]);

const NONWALKABLE_SURFACES = new Set(["wall", "prop", "deep-water"]);

describe("map surface metadata contract", () => {
    it("every curated tile declares a surface and walkable flag", () => {
        const missing: string[] = [];
        for (const tile of tiles) {
            if (!tile.surface) missing.push(`${tile.id}: missing surface`);
            if (typeof tile.walkable !== "boolean") {
                missing.push(`${tile.id}: missing walkable flag`);
            }
        }
        expect(missing).toEqual([]);
    });

    it("walkable flag matches the surface's expected traversability", () => {
        const inconsistent: string[] = [];
        for (const tile of tiles) {
            const surface = tile.surface;
            if (!surface) continue;
            if (WALKABLE_SURFACES.has(surface) && tile.walkable !== true) {
                inconsistent.push(
                    `${tile.id}: surface=${surface} should be walkable but walkable=${tile.walkable}`,
                );
            }
            if (NONWALKABLE_SURFACES.has(surface) && tile.walkable !== false) {
                inconsistent.push(
                    `${tile.id}: surface=${surface} should NOT be walkable but walkable=${tile.walkable}`,
                );
            }
            if (!WALKABLE_SURFACES.has(surface) && !NONWALKABLE_SURFACES.has(surface)) {
                inconsistent.push(
                    `${tile.id}: surface=${surface} is not in the known walkable/non-walkable sets — extend the lint`,
                );
            }
        }
        expect(inconsistent).toEqual([]);
    });

    it("every palette tile used by a shipped map resolves to a surface", () => {
        const unresolved: string[] = [];

        for (const spec of SHIPPED_SPECS) {
            for (const [name, entry] of usedPaletteEntries(spec)) {
                if (entry.tsx.startsWith("generated/")) continue;
                if (!entry.art_id) {
                    unresolved.push(`${spec.id}:${name}:${entry.tsx}#${entry.local_id} has no art_id`);
                    continue;
                }
                const curated = bySurfaceWalkability.get(entry.art_id);
                if (!curated) {
                    unresolved.push(`${spec.id}:${name}:${entry.art_id} is not in the curated manifest`);
                    continue;
                }
                if (!curated.surface) {
                    unresolved.push(`${spec.id}:${name}:${entry.art_id} has no surface`);
                }
            }
        }

        expect(unresolved).toEqual([]);
    });
});

function usedPaletteEntries(spec: MapSpec): Array<[string, PaletteEntry]> {
    const names = new Set<string>();
    for (const layer of [
        spec.layers["Below Player"],
        spec.layers["Ground Detail"],
        spec.layers.World,
        spec.layers["Above Player"],
    ]) {
        if (!layer) continue;
        if (isTileGrid(layer)) {
            for (const row of layer) {
                for (const name of row) {
                    if (name && name !== ".") names.add(name);
                }
            }
        } else {
            for (const placed of layer) names.add(placed.tile);
        }
    }
    return [...names].sort().map((name) => [name, spec.palette[name]]);
}

function isTileGrid(layer: TileGrid | PlacedTile[]): layer is TileGrid {
    return Array.isArray(layer[0]);
}
