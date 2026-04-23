import type { PaletteEntry, PaletteRole, PaletteSurface, ParsedTileset } from "./types";
import { tsxQualifiedKey, tsxStem } from "./palette";

export interface PaletteSemantic {
    surface: PaletteSurface;
    role: PaletteRole;
    walkable: boolean;
    collides: boolean;
    wangColors: string[];
}

export interface WangBridgeCandidate {
    wangset: string;
    tileid: number;
    colors: string[];
}

export function tilesetForPaletteEntry(
    entry: PaletteEntry,
    tilesets: ParsedTileset[],
): ParsedTileset | undefined {
    return tilesets.find(
        (tileset) => tsxQualifiedKey(tileset) === entry.tsx || tsxStem(tileset) === entry.tsx,
    );
}

export function tileHasCollision(tileset: ParsedTileset, localId: number): boolean {
    const props = tileset.properties[localId] ?? {};
    const hasCollisionProperty = Object.entries(props).some(([name, value]) => {
        if (!/(collid|collision|block|solid)/i.test(name)) return false;
        return value === true || value === "true" || value === 1 || value === "1";
    });
    return (
        hasCollisionProperty ||
        (objectGroupsAreBlocking(tileset) && (tileset.objectGroups[localId]?.length ?? 0) > 0)
    );
}

export function wangColorNamesForTile(tileset: ParsedTileset, localId: number): string[] {
    const names = new Set<string>();
    for (const wangset of tileset.wangsets) {
        const wangTile = wangset.tiles.find((tile) => tile.tileid === localId);
        if (!wangTile) continue;
        for (const colorIndex of wangTile.wangid) {
            if (colorIndex <= 0) continue;
            const color = wangset.colors.find((candidate) => candidate.index === colorIndex);
            if (color?.name) names.add(color.name);
        }
    }
    return [...names];
}

export function wangBridgeCandidatesForTileset(tileset: ParsedTileset): WangBridgeCandidate[] {
    const candidates: WangBridgeCandidate[] = [];
    for (const wangset of tileset.wangsets) {
        for (const tile of wangset.tiles) {
            const colors = new Set<string>();
            for (const colorIndex of tile.wangid) {
                if (colorIndex <= 0) continue;
                const color = wangset.colors.find((candidate) => candidate.index === colorIndex);
                if (color?.name && color.name !== "Empty") colors.add(color.name);
            }
            if (colors.size > 1) {
                candidates.push({
                    wangset: wangset.name,
                    tileid: tile.tileid,
                    colors: [...colors].sort(),
                });
            }
        }
    }
    return candidates;
}

export function classifyPaletteEntry(
    name: string,
    entry: PaletteEntry,
    tileset: ParsedTileset | undefined,
): PaletteSemantic {
    const collides = tileset ? tileHasCollision(tileset, entry.local_id) : false;
    const wangColors = tileset ? wangColorNamesForTile(tileset, entry.local_id) : [];
    const surface = entry.surface ?? inferSurface(name, entry, wangColors);
    const role = entry.role ?? inferRole(entry, surface, collides, wangColors);
    const walkable = entry.walkable ?? inferWalkable(surface, role, collides);

    return {
        surface,
        role,
        walkable,
        collides,
        wangColors,
    };
}

export function isActorSurface(semantic: PaletteSemantic): boolean {
    return semantic.walkable && semantic.role !== "encounter";
}

export function isEncounterSurface(semantic: PaletteSemantic): boolean {
    return semantic.walkable && semantic.role === "encounter";
}

function inferSurface(name: string, entry: PaletteEntry, wangColors: string[]): PaletteSurface {
    const tsx = entry.tsx.toLowerCase();
    const description = (entry.description ?? "").toLowerCase();
    const text = `${name} ${tsx} ${description}`;

    if (/tallgrass|tall grass|encounter|overgrowth/.test(text)) return "rough-grass";
    if (/rockslope|cliff|wall|blocked cave|cave wall/.test(text)) return "wall";
    if (/fence|building|tree|bush|rock|props|objects_|animation_/.test(text)) return "prop";
    if (/sand|shore|beach/.test(text)) return "sand";
    if (
        /water/.test(tsx) ||
        /\b(blocked )?(animated )?(river|lake|deep )?water\b/.test(description)
    ) {
        return "deep-water";
    }
    if (/ice|icy/.test(text)) return "ice";
    if (/snow/.test(text)) return "snow";
    if (/stone|plaza|peak path|castle_floor/.test(text)) return "stone-path";
    if (/road|path|dirt|causeway|trail/.test(text)) return "dirt-path";
    if (/ground|grass/.test(text) || wangColors.some((color) => /grass/i.test(color))) {
        return "smooth-grass";
    }
    return "unknown";
}

function objectGroupsAreBlocking(tileset: ParsedTileset): boolean {
    const key = `${tsxQualifiedKey(tileset)} ${tsxStem(tileset)} ${tileset.name}`.toLowerCase();
    if (/tallgrass|tall grass/.test(key)) return false;
    return (
        tileset.isCollection ||
        /water|rockslope|fence|wall|cliff|objects_|building|tree|bush|rock|props/.test(key)
    );
}

function inferRole(
    entry: PaletteEntry,
    surface: PaletteSurface,
    collides: boolean,
    wangColors: string[],
): PaletteRole {
    const text = `${entry.tsx} ${entry.description ?? ""}`.toLowerCase();

    if (surface === "rough-grass") return "encounter";
    if (collides || surface === "deep-water" || surface === "wall") return "blocker";
    if (surface === "prop") return "decoration";
    if (/transition|edge|shore/.test(text) || wangColors.length > 1) return "transition";
    return "base";
}

function inferWalkable(surface: PaletteSurface, role: PaletteRole, collides: boolean): boolean {
    if (collides) return false;
    if (role === "blocker" || role === "decoration") return false;
    return !["deep-water", "wall", "prop", "unknown"].includes(surface);
}
