/**
 * Chunk persistence — SQLite-backed delta store per `(seed, x, y)`.
 *
 * Per docs/WORLD_GENERATION.md § Persistence and docs/DESIGN.md §
 * Seeded, persistent, open.
 *
 * Composite primary key `id` is `"${seed}:${x}:${y}"`.
 */

import { getDatabase } from "../platform/persistence/database";
import type { ChunkCoord } from "./world-generator";
import type { ChallengeState } from "./challenge-template";

export type ChunkDelta = {
    openedChestIds: string[];
    despawnedNpcIds: string[];
    resolvedChallengeIds: string[];
    /** NPC key (e.g. "3:2:1" = seed:spawnX:spawnY) → challenge lifecycle state. */
    challengeStates: Record<string, ChallengeState>;
};

function chunkId(seed: number, { x, y }: ChunkCoord): string {
    return `${seed}:${x}:${y}`;
}

export async function isChunkVisited(seed: number, coord: ChunkCoord): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.query(
        "SELECT 1 FROM chunk_visits WHERE id = ?",
        [chunkId(seed, coord)],
    );
    return (result.values?.length ?? 0) > 0;
}

export async function markChunkVisited(seed: number, coord: ChunkCoord): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT OR IGNORE INTO chunk_visits (id, seed, x, y, visited_at)
         VALUES (?, ?, ?, ?, ?)`,
        [chunkId(seed, coord), seed, coord.x, coord.y, new Date().toISOString()],
    );
}

export async function loadChunkDelta(
    seed: number,
    coord: ChunkCoord,
): Promise<ChunkDelta | null> {
    const db = await getDatabase();
    const result = await db.query(
        "SELECT delta_json FROM chunk_deltas WHERE id = ?",
        [chunkId(seed, coord)],
    );
    const row = result.values?.[0];
    if (!row) return null;
    return JSON.parse(row.delta_json as string) as ChunkDelta;
}

export async function persistChunkDelta(
    seed: number,
    coord: ChunkCoord,
    delta: ChunkDelta,
): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT OR REPLACE INTO chunk_deltas (id, seed, x, y, delta_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            chunkId(seed, coord),
            seed,
            coord.x,
            coord.y,
            JSON.stringify(delta),
            new Date().toISOString(),
        ],
    );
}
