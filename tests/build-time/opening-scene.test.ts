import { describe, expect, it } from "vitest";
import { OPENING_SCENE_CONFIG } from "../../src/content/gameplay";
import { decideOpeningScene } from "../../src/modules/main/opening-scene";

const OPENING_SCENE_BEATS = OPENING_SCENE_CONFIG.beats;
const OPENING_SCENE_FLAG = OPENING_SCENE_CONFIG.flagId;

/**
 * T11-11 — scripted opening scene. Pure-logic guard:
 *  - first-run plays the full scene
 *  - returning players with a persisted flag skip
 *  - a defensive branch catches the "starter already chosen but
 *    opening flag not set" case (save migration, test fixture)
 */
describe("opening scene decision", () => {
    it("plays the full scene on a clean first run", () => {
        expect(
            decideOpeningScene({ openingComplete: false, starterChosen: false }),
        ).toBe("play_full");
    });

    it("skips if the completion flag is set", () => {
        expect(
            decideOpeningScene({ openingComplete: true, starterChosen: false }),
        ).toBe("skip_already_played");
        expect(
            decideOpeningScene({ openingComplete: true, starterChosen: true }),
        ).toBe("skip_already_played");
    });

    it("skips defensively if a starter was chosen but the opening flag is missing", () => {
        // Happens if a pre-T11-11 save is loaded into a post-T11-11 build.
        // We don't replay the opening because the player already has a party.
        expect(
            decideOpeningScene({ openingComplete: false, starterChosen: true }),
        ).toBe("skip_starter_already_chosen");
    });
});

describe("opening scene content", () => {
    it("covers the three narrative beats at minimum", () => {
        // Beats exist for: home (where), call (who), stakes (why), objective (what).
        // Four-beat minimum for the full 16-bit opening structure.
        expect(OPENING_SCENE_BEATS.length).toBeGreaterThanOrEqual(4);
    });

    it("uses the canonical flag name that NG+ clears in its reset set", () => {
        // NG+ (src/modules/main/new-game-plus.ts) clears the full flags
        // map to {}, so any opening-flag name will be cleared on reset.
        // This test exists to document the invariant: DO NOT special-case
        // this flag in the NG+ carry-over list.
        expect(OPENING_SCENE_FLAG).toBe("opening_scene_complete");
    });

    it("mentions Rivers, Selby, and something upstream — the three story anchors", () => {
        const joined = OPENING_SCENE_BEATS.join(" ").toLowerCase();
        expect(joined).toContain("rivers");
        expect(joined).toContain("selby");
        expect(joined).toContain("upstream");
    });
});
