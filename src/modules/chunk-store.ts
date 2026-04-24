/**
 * Chunk persistence — SQLite-backed delta store per `(seed, x, y)`.
 *
 * Per docs/WORLD_GENERATION.md § Persistence and docs/DESIGN.md §
 * Seeded, persistent, open. Unimplemented; Phase 3 populates.
 *
 * Responsibilities:
 *   - Load a chunk: run `realizeChunk` from world-generator, apply deltas.
 *   - Persist deltas when the player changes chunk state (NPC moved,
 *     chest opened, challenge resolved, catch recorded).
 *   - Flush deltas on chunk exit and on save-game.
 */

import type { ChunkCoord, RealizedChunk } from "./world-generator";

export type ChunkDelta = {
    seed: number;
    coord: ChunkCoord;
    // TODO(Phase 3): define delta shape (opened chests, resolved challenges,
    // despawned NPCs, etc). See docs/WORLD_GENERATION.md.
};

/**
 * Load the chunk at `(seed, coord)`: base realization + applied deltas.
 */
export function loadChunk(_seed: number, _coord: ChunkCoord): RealizedChunk {
    throw new Error("chunk-store.loadChunk unimplemented (Phase 3)");
}

/**
 * Append a delta. Flushed later; not synchronous.
 */
export function persistDelta(_delta: ChunkDelta): void {
    throw new Error("chunk-store.persistDelta unimplemented (Phase 3)");
}

/**
 * Flush pending deltas to SQLite. Called on chunk exit + save-game.
 */
export function flushDeltas(_seed: number): Promise<void> {
    throw new Error("chunk-store.flushDeltas unimplemented (Phase 3)");
}
