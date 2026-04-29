/**
 * World map data builder — pure function for the pause-menu world map view.
 *
 * Converts the set of visited chunk keys + current player coord into a
 * tile array the UI can render: biome color, chunk name, player position.
 *
 * Per docs/WORLD_GENERATION.md § Pause-menu world map.
 */

import { chunkType, chunkName, type ChunkType, type ChunkCoord } from "../world-generator";
import type { Seed } from "../seed";

export type WorldMapTile = {
    x: number;
    y: number;
    type: ChunkType;
    name: string;
    visited: boolean;
    isPlayer: boolean;
};

export type WorldMapData = {
    tiles: WorldMapTile[];
    playerChunk: ChunkCoord;
};

/** Parse a stored chunk key `"x:y"` back to a coord. */
function parseKey(key: string): ChunkCoord | null {
    const parts = key.split(":");
    if (parts.length !== 2) return null;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
}

/**
 * Build the world map tile array for the pause-menu.
 *
 * @param seed - Active world seed (drives chunkType + chunkName).
 * @param visitedKeys - Set of "x:y" strings from the chunk-visits DB table.
 * @param playerChunk - The chunk the player is currently in.
 */
export function buildWorldMapData(
    seed: Seed,
    visitedKeys: Set<string>,
    playerChunk: ChunkCoord,
): WorldMapData {
    const coordMap = new Map<string, ChunkCoord>();

    // Always include the player's chunk even if not yet in visitedKeys
    const playerKey = `${playerChunk.x}:${playerChunk.y}`;
    coordMap.set(playerKey, playerChunk);

    for (const key of visitedKeys) {
        const coord = parseKey(key);
        if (coord) coordMap.set(key, coord);
    }

    const tiles: WorldMapTile[] = [];
    for (const [key, coord] of coordMap) {
        tiles.push({
            x: coord.x,
            y: coord.y,
            type: chunkType(seed, coord.x, coord.y),
            name: chunkName(seed, coord),
            visited: visitedKeys.has(key),
            isPlayer: coord.x === playerChunk.x && coord.y === playerChunk.y,
        });
    }

    // Sort by y desc then x asc for stable, top-to-bottom rendering order
    tiles.sort((a, b) => b.y - a.y || a.x - b.x);

    return { tiles, playerChunk };
}
