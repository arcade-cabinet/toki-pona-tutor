import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    setPreferencesImpl,
    type PreferencesAdapter,
} from "../../src/platform/persistence/preferences";
import {
    loadActiveSeed,
    newGameSeed,
    resumeSeed,
    clearActiveSeed,
} from "../../src/platform/persistence/seed-persistence";
import { parseSeed } from "../../src/modules/seed";

/**
 * T123: Seed persistence — new game creates a fresh seed; resume restores it.
 */

class InMemoryPrefs implements PreferencesAdapter {
    private store = new Map<string, string>();
    async get(key: string) { return this.store.get(key) ?? null; }
    async set(key: string, value: string) { this.store.set(key, value); }
    async remove(key: string) { this.store.delete(key); }
    async clear() { this.store.clear(); }
    async keys() { return [...this.store.keys()]; }
}

beforeEach(() => {
    setPreferencesImpl(new InMemoryPrefs());
});

afterEach(() => {
    setPreferencesImpl(new InMemoryPrefs());
});

describe("newGameSeed", () => {
    it("returns a valid 32-bit seed and persists it", async () => {
        const seed = await newGameSeed();
        expect(Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32).toBe(true);
        const loaded = await loadActiveSeed();
        expect(loaded).toBe(seed);
    });

    it("accepts an explicit seed", async () => {
        const seed = await newGameSeed(42);
        expect(seed).toBe(42);
        const loaded = await loadActiveSeed();
        expect(loaded).toBe(42);
    });

    it("accepts a string seed", async () => {
        const seed = await newGameSeed("riverflow");
        expect(seed).toBe(parseSeed("riverflow"));
        const loaded = await loadActiveSeed();
        expect(loaded).toBe(parseSeed("riverflow"));
    });
});

describe("resumeSeed", () => {
    it("returns the persisted seed", async () => {
        await newGameSeed(999);
        const seed = await resumeSeed();
        expect(seed).toBe(999);
    });

    it("returns null when no seed is persisted", async () => {
        const seed = await resumeSeed();
        expect(seed).toBeNull();
    });
});

describe("loadActiveSeed", () => {
    it("returns null before any new game", async () => {
        expect(await loadActiveSeed()).toBeNull();
    });

    it("returns the seed after newGameSeed", async () => {
        await newGameSeed(1234);
        expect(await loadActiveSeed()).toBe(1234);
    });
});

describe("clearActiveSeed", () => {
    it("removes the persisted seed", async () => {
        await newGameSeed(77);
        await clearActiveSeed();
        expect(await loadActiveSeed()).toBeNull();
    });
});
