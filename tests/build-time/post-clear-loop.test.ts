import { describe, it, expect } from "vitest";
import { decideFinalBossTrigger } from "../../src/modules/main/green-dragon";

/**
 * T14 — post-clear free-exploration loop.
 *
 * Once the player beats the green dragon the first time, credits roll
 * and `clearedFlag` is set. From that point on the story-bible promise
 * (`docs/STORY.md`) is free exploration: the player can come back to the
 * rivergate and re-fight the dragon for bestiary completion or for fun.
 *
 * `decideFinalBossTrigger` is the pure state machine behind that
 * promise. Given `(defeated, cleared, badgesEarned)` it tells the
 * runtime whether to ignore the trigger, start the first fight, or
 * clear defeatedFlag and restart for a re-fight. Credits roll only on
 * the FIRST clear; re-fights skip credits (see the first-clear gate on
 * `showCredits` in green-dragon.ts).
 */
describe("final boss trigger — pre-clear", () => {
    it("silent if badges not earned, even with no other flags", () => {
        expect(
            decideFinalBossTrigger({
                defeated: false,
                cleared: false,
                badgesEarned: false,
            }),
        ).toBe("not_ready");
    });

    it("silent if badges not earned, even if a stale defeated flag lingers", () => {
        // Shouldn't happen in practice, but the gate is badge-first.
        expect(
            decideFinalBossTrigger({
                defeated: true,
                cleared: true,
                badgesEarned: false,
            }),
        ).toBe("not_ready");
    });

    it("starts the first fight when badges are earned and dragon is fresh", () => {
        expect(
            decideFinalBossTrigger({
                defeated: false,
                cleared: false,
                badgesEarned: true,
            }),
        ).toBe("start_fight");
    });

    it("blocks re-entry if defeated but not yet cleared (defensive)", () => {
        // Should not normally happen — onDefeated writes both flags in
        // the same handler. Treated as blocked so the player doesn't
        // double-fight while credits are still rolling.
        expect(
            decideFinalBossTrigger({
                defeated: true,
                cleared: false,
                badgesEarned: true,
            }),
        ).toBe("blocked_defeated_pre_clear");
    });
});

describe("final boss trigger — post-clear free exploration", () => {
    it("restarts the fight once cleared, so the player can come back", () => {
        expect(
            decideFinalBossTrigger({
                defeated: true,
                cleared: true,
                badgesEarned: true,
            }),
        ).toBe("restart_fight");
    });

    it("starts a fresh fight if clearedFlag is set but defeatedFlag somehow cleared", () => {
        // NG+ paths clear defeatedFlag but keep clearedFlag set. Treat
        // this like a normal first fight — not a restart, because there's
        // nothing to clear.
        expect(
            decideFinalBossTrigger({
                defeated: false,
                cleared: true,
                badgesEarned: true,
            }),
        ).toBe("start_fight");
    });
});
