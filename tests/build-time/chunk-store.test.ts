import { afterEach, describe, expect, it } from "vitest";
import {
    isChunkVisited,
    loadChunkDelta,
    markChunkVisited,
    persistChunkDelta,
    type ChunkDelta,
} from "../../src/modules/chunk-store";
import { resetPersistedRuntimeState } from "../../src/platform/persistence/runtime-state";

/**
 * T121: SQLite schema for chunk deltas.
 * T122: Chunk-store module — loadChunkDelta, persistChunkDelta, markChunkVisited, isChunkVisited.
 */

const SEED = 42;

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

describe("isChunkVisited", () => {
    it("returns false for an unvisited chunk", async () => {
        expect(await isChunkVisited(SEED, { x: 0, y: 0 })).toBe(false);
    });

    it("returns true after markChunkVisited", async () => {
        await markChunkVisited(SEED, { x: 5, y: -3 });
        expect(await isChunkVisited(SEED, { x: 5, y: -3 })).toBe(true);
    });

    it("is seed-scoped — same coord different seed is unvisited", async () => {
        await markChunkVisited(SEED, { x: 1, y: 1 });
        expect(await isChunkVisited(999, { x: 1, y: 1 })).toBe(false);
    });

    it("markChunkVisited is idempotent", async () => {
        await markChunkVisited(SEED, { x: 0, y: 0 });
        await markChunkVisited(SEED, { x: 0, y: 0 }); // second call must not throw
        expect(await isChunkVisited(SEED, { x: 0, y: 0 })).toBe(true);
    });
});

describe("loadChunkDelta / persistChunkDelta", () => {
    it("returns null for a chunk with no persisted delta", async () => {
        expect(await loadChunkDelta(SEED, { x: 0, y: 0 })).toBeNull();
    });

    it("persists and retrieves a delta round-trip", async () => {
        const delta: ChunkDelta = {
            openedChestIds: ["chest_nw"],
            despawnedNpcIds: [],
            resolvedChallengeIds: [],
            challengeStates: {},
        };
        await persistChunkDelta(SEED, { x: 3, y: -1 }, delta);
        const loaded = await loadChunkDelta(SEED, { x: 3, y: -1 });
        expect(loaded).toEqual(delta);
    });

    it("overwrites the delta on re-persist", async () => {
        const first: ChunkDelta = {
            openedChestIds: ["chest_nw"],
            despawnedNpcIds: [],
            resolvedChallengeIds: [],
            challengeStates: {},
        };
        const second: ChunkDelta = {
            openedChestIds: ["chest_nw", "chest_se"],
            despawnedNpcIds: ["npc_guide"],
            resolvedChallengeIds: ["challenge_1"],
            challengeStates: { "42:3:2": "accepted" },
        };
        await persistChunkDelta(SEED, { x: 0, y: 0 }, first);
        await persistChunkDelta(SEED, { x: 0, y: 0 }, second);
        const loaded = await loadChunkDelta(SEED, { x: 0, y: 0 });
        expect(loaded).toEqual(second);
    });

    it("is seed-scoped — same coord different seed has independent delta", async () => {
        const delta: ChunkDelta = {
            openedChestIds: ["chest_a"],
            despawnedNpcIds: [],
            resolvedChallengeIds: [],
            challengeStates: {},
        };
        await persistChunkDelta(SEED, { x: 2, y: 2 }, delta);
        expect(await loadChunkDelta(999, { x: 2, y: 2 })).toBeNull();
    });

    it("negative coordinates are stored correctly", async () => {
        const delta: ChunkDelta = {
            openedChestIds: [],
            despawnedNpcIds: ["npc_1"],
            resolvedChallengeIds: [],
            challengeStates: {},
        };
        await persistChunkDelta(SEED, { x: -10, y: -20 }, delta);
        const loaded = await loadChunkDelta(SEED, { x: -10, y: -20 });
        expect(loaded?.despawnedNpcIds).toEqual(["npc_1"]);
    });
});
