import { describe, expect, it } from "vitest";
import artManifest from "../../src/content/art/tilesets.json";
import maTomoLili from "../../scripts/map-authoring/specs/riverside_home";
import nasinWan from "../../scripts/map-authoring/specs/greenwood_road";
import nasinPiTelo from "../../scripts/map-authoring/specs/rivergate_approach";
import maTelo from "../../scripts/map-authoring/specs/lakehaven";
import maLete from "../../scripts/map-authoring/specs/frostvale";
import nenaSewi from "../../scripts/map-authoring/specs/highridge_pass";
import nenaSuli from "../../scripts/map-authoring/specs/dreadpeak_cavern";
import { curatedArtEntry, curatedTile, isRejectedCuratedTile } from "../../scripts/map-authoring/config/art-curation";
import type { MapSpec, PaletteEntry, PlacedTile, TileGrid } from "../../scripts/map-authoring/lib/types";

const SHIPPED_SPECS = [
    maTomoLili,
    nasinWan,
    nenaSewi,
    maTelo,
    maLete,
    nenaSuli,
    nasinPiTelo,
] as const satisfies readonly MapSpec[];

describe("v1 art curation manifest", () => {
    it("classifies the current and pending art direction inputs", () => {
        expect(artManifest.strategy).toBe("fan_tasy_v1");
        expect(artManifest.roles).toEqual(
            expect.arrayContaining([
                "solid_fill",
                "transparent_overlay",
                "multi_tile_object",
                "transition",
                "animated",
                "collision_blocker",
                "reject",
            ]),
        );
        expect(artManifest.candidate_packs.map((pack) => pack.id)).toEqual(
            expect.arrayContaining([
                "fan_tasy_current",
                "fan_tasy_castles_fortresses",
                "fan_tasy_medieval_interiors",
                "lonesome_grand_forests",
                "natural_dungeons",
                "old_town",
                "creature_combat_pending",
            ]),
        );

        // Non-Fan-tasy packs are rejected for v1; Fan-tasy packs are approved.
        const byId = new Map(artManifest.candidate_packs.map((p) => [p.id, p]));
        expect(byId.get("fan_tasy_current")?.status).toBe("approved");
        expect(byId.get("fan_tasy_castles_fortresses")?.status).toBe("approved_pending_promote");
        expect(byId.get("fan_tasy_medieval_interiors")?.status).toBe("approved_pending_promote");
        expect(byId.get("lonesome_grand_forests")?.status).toBe("rejected_for_v1");
        expect(byId.get("natural_dungeons")?.status).toBe("rejected_for_v1");
        expect(byId.get("old_town")?.status).toBe("rejected_for_v1");
    });

    it("records known bad encounter tiles as rejected, not merely unused", () => {
        expect(isRejectedCuratedTile("fan_tasy.seasons.tall_grass.stubby_green_box")).toBe(true);
        expect(isRejectedCuratedTile("fan_tasy.snow.tall_grass.green_snow_mismatch")).toBe(true);
        expect(() => curatedTile("fan_tasy.seasons.tall_grass.stubby_green_box")).toThrow(
            /rejected/,
        );
    });

    it("requires every shipped non-generated palette tile to resolve through curated art", () => {
        const misses: string[] = [];
        const mismatches: string[] = [];
        const rejected: string[] = [];

        for (const spec of SHIPPED_SPECS) {
            for (const [name, entry] of usedPaletteEntries(spec)) {
                if (entry.tsx.startsWith("generated/")) continue;
                if (!entry.art_id) {
                    misses.push(`${spec.id}:${name}:${entry.tsx}#${entry.local_id}`);
                    continue;
                }
                const curated = curatedArtEntry(entry.art_id);
                if (curated.status === "reject") {
                    rejected.push(`${spec.id}:${name}:${entry.art_id}`);
                }
                if (curated.source !== entry.tsx || curated.local_id !== entry.local_id) {
                    mismatches.push(
                        `${spec.id}:${name}:${entry.art_id} -> ${curated.source}#${curated.local_id}, palette ${entry.tsx}#${entry.local_id}`,
                    );
                }
            }
        }

        expect(misses).toEqual([]);
        expect(rejected).toEqual([]);
        expect(mismatches).toEqual([]);
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
