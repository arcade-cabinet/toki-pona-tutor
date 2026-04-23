import artManifest from "../../../src/content/art/tilesets.json";
import type { PaletteEntry, PaletteRole, PaletteSurface } from "../lib/types";

export type CuratedTileStatus = "approved" | "provisional" | "reject";
export type CuratedTileRole =
    | "solid_fill"
    | "transparent_overlay"
    | "multi_tile_object"
    | "transition"
    | "animated"
    | "collision_blocker"
    | "reject";

export interface CuratedTile {
    id: string;
    pack: string;
    family: string;
    source: string;
    local_id: number;
    roles: CuratedTileRole[];
    surface?: PaletteSurface;
    palette_role?: PaletteRole;
    walkable?: boolean;
    status: CuratedTileStatus;
    transparency: "opaque" | "transparent" | "mixed";
    biomes: string[];
    notes: string;
}

type CuratedPaletteOverrides = Partial<
    Pick<PaletteEntry, "description" | "surface" | "role" | "walkable" | "multiTile">
>;

const tilesById = new Map<string, CuratedTile>(
    (artManifest.tiles as CuratedTile[]).map((tile) => [tile.id, tile]),
);

export function curatedArtEntry(id: string): CuratedTile {
    const tile = tilesById.get(id);
    if (!tile) throw new Error(`unknown curated art tile "${id}"`);
    return tile;
}

export function curatedTile(id: string, overrides: CuratedPaletteOverrides = {}): PaletteEntry {
    const tile = curatedArtEntry(id);
    if (tile.status === "reject") {
        throw new Error(`curated art tile "${id}" is rejected and cannot be used in a palette`);
    }

    return {
        art_id: id,
        tsx: tile.source,
        local_id: tile.local_id,
        description: overrides.description ?? tile.notes,
        surface: overrides.surface ?? tile.surface,
        role: overrides.role ?? tile.palette_role,
        walkable: overrides.walkable ?? tile.walkable,
        multiTile: overrides.multiTile,
    };
}

export function curatedTileIds(): string[] {
    return [...tilesById.keys()].sort();
}

export function isRejectedCuratedTile(id: string): boolean {
    return curatedArtEntry(id).status === "reject";
}
