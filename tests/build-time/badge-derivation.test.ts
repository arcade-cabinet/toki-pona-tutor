import { describe, it, expect } from "vitest";
import { maybeSetProofsAllFour, PROOFS_ALL_FOUR_FLAG } from "../../src/modules/main/badge-derivation";

/**
 * T76: maybeSetProofsAllFour checks every badge in FINAL_BOSS_CONFIG
 * and sets the derived flag only when all are present. Uses injected
 * read/write shims so the pure-logic path runs without booting the
 * SQLite persistence layer.
 */

function makeStore(initial: Record<string, string> = {}) {
    const store = new Map<string, string>(Object.entries(initial));
    const read = async (id: string) => store.get(id) ?? null;
    const write = async (id: string, value: string) => {
        store.set(id, value);
    };
    return { store, read, write };
}

describe("T76: maybeSetProofsAllFour", () => {
    it("leaves the flag unset when no badges are earned", async () => {
        const { store, read, write } = makeStore();
        const fired = await maybeSetProofsAllFour(read, write);
        expect(fired).toBe(false);
        expect(store.has(PROOFS_ALL_FOUR_FLAG)).toBe(false);
    });

    it("leaves the flag unset when only some badges are earned", async () => {
        const { store, read, write } = makeStore({
            badge_sewi: "1",
            badge_telo: "1",
            // badge_lete + badge_suli missing
        });
        const fired = await maybeSetProofsAllFour(read, write);
        expect(fired).toBe(false);
        expect(store.has(PROOFS_ALL_FOUR_FLAG)).toBe(false);
    });

    it("fires the flag when all four badges are truthy", async () => {
        const { store, read, write } = makeStore({
            badge_sewi: "1",
            badge_telo: "1",
            badge_lete: "1",
            badge_suli: "1",
        });
        const fired = await maybeSetProofsAllFour(read, write);
        expect(fired).toBe(true);
        expect(store.get(PROOFS_ALL_FOUR_FLAG)).toBe("1");
    });

    it("treats '0' and empty string as unset (matches selectDialogState truthy rules)", async () => {
        const { store, read, write } = makeStore({
            badge_sewi: "1",
            badge_telo: "1",
            badge_lete: "0",
            badge_suli: "",
        });
        const fired = await maybeSetProofsAllFour(read, write);
        expect(fired).toBe(false);
        expect(store.has(PROOFS_ALL_FOUR_FLAG)).toBe(false);
    });

    it("is idempotent when called with all four already set", async () => {
        const { store, read, write } = makeStore({
            badge_sewi: "1",
            badge_telo: "1",
            badge_lete: "1",
            badge_suli: "1",
            [PROOFS_ALL_FOUR_FLAG]: "1",
        });
        const fired = await maybeSetProofsAllFour(read, write);
        expect(fired).toBe(true);
        expect(store.get(PROOFS_ALL_FOUR_FLAG)).toBe("1");
    });
});
