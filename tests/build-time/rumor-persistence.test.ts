import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
    loadActiveRumors,
    saveActiveRumors,
    addRumor,
    pruneExpiredRumors,
} from "../../src/platform/persistence/rumor-persistence";
import {
    setPreferencesImpl,
    type PreferencesAdapter,
} from "../../src/platform/persistence/preferences";
import type { Rumor } from "../../src/modules/rumor-resolver";

/**
 * T152: Rumor persistence — load/save/add/prune.
 */

class InMemoryPrefs implements PreferencesAdapter {
    private store = new Map<string, string>();
    async get(key: string) { return this.store.get(key) ?? null; }
    async set(key: string, value: string) { this.store.set(key, value); }
    async remove(key: string) { this.store.delete(key); }
    async clear() { this.store.clear(); }
    async keys() { return [...this.store.keys()]; }
}

beforeEach(() => setPreferencesImpl(new InMemoryPrefs()));
afterEach(() => setPreferencesImpl(new InMemoryPrefs()));

function makeRumor(templateId: string, issuedDay: number, expiresDay: number): Rumor {
    return {
        templateId,
        targetChunk: { x: 2, y: 3 },
        direction: "east",
        distanceHint: "close",
        issuedDay,
        expiresDay,
    };
}

describe("loadActiveRumors", () => {
    it("returns empty array when no rumors stored", async () => {
        const rumors = await loadActiveRumors();
        expect(Array.isArray(rumors)).toBe(true);
    });
});

describe("saveActiveRumors / loadActiveRumors round-trip", () => {
    it("persists and retrieves rumors", async () => {
        const rumors = [makeRumor("templ_1", 1, 31)];
        await saveActiveRumors(rumors);
        const loaded = await loadActiveRumors();
        expect(loaded).toHaveLength(1);
        expect(loaded[0]!.templateId).toBe("templ_1");
    });

    it("overwrites on second save", async () => {
        await saveActiveRumors([makeRumor("templ_a", 1, 31), makeRumor("templ_b", 2, 32)]);
        await saveActiveRumors([makeRumor("templ_c", 3, 33)]);
        const loaded = await loadActiveRumors();
        expect(loaded).toHaveLength(1);
        expect(loaded[0]!.templateId).toBe("templ_c");
    });
});

describe("addRumor", () => {
    it("appends a new rumor to the stored list", async () => {
        await saveActiveRumors([]);
        await addRumor(makeRumor("first", 1, 31));
        await addRumor(makeRumor("second", 2, 32));
        const loaded = await loadActiveRumors();
        expect(loaded).toHaveLength(2);
        expect(loaded.map((r) => r.templateId)).toContain("first");
        expect(loaded.map((r) => r.templateId)).toContain("second");
    });

    it("does not duplicate a rumor with the same templateId", async () => {
        await saveActiveRumors([makeRumor("dup", 1, 31)]);
        await addRumor(makeRumor("dup", 2, 32));
        const loaded = await loadActiveRumors();
        expect(loaded.filter((r) => r.templateId === "dup")).toHaveLength(1);
    });
});

describe("pruneExpiredRumors", () => {
    it("removes rumors past their expiresDay", async () => {
        await saveActiveRumors([
            makeRumor("fresh", 1, 100),
            makeRumor("expired", 1, 5),
        ]);
        await pruneExpiredRumors(10);
        const loaded = await loadActiveRumors();
        expect(loaded.map((r) => r.templateId)).toEqual(["fresh"]);
    });

    it("keeps all rumors when none have expired", async () => {
        await saveActiveRumors([makeRumor("r1", 1, 50), makeRumor("r2", 1, 60)]);
        await pruneExpiredRumors(1);
        expect(await loadActiveRumors()).toHaveLength(2);
    });
});
