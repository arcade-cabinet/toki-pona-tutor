import { describe, expect, it } from "vitest";
import {
    buildOfferChoices,
    buildJournalEntries,
    pickPostResolveLine,
    type ChallengeOfferConfig,
    type JournalEntry,
} from "../../src/modules/main/challenge-npc";
import type { ChallengeInstance } from "../../src/modules/challenge-template";
import type { NpcDialogProfile, DialogLine } from "../../src/modules/dialog-pool";

/**
 * T147: Challenge offer UI — pure logic: choices builder and journal builder.
 */

const CONFIG: ChallengeOfferConfig = {
    acceptLabel: "Accept",
    declineLabel: "No thanks",
    deferLabel: "Maybe later",
    journalEntryTemplate: "{npc}: {cause}",
    journalEmptyLabel: "No active challenges.",
    journalSectionLabel: "Challenges",
};

function makeChallenge(overrides: Partial<ChallengeInstance> = {}): ChallengeInstance {
    return {
        cause: "find_pet",
        effect: "catch_species",
        params: { species: "applepup", biome_feature: "pond" },
        rewardModifier: "challenge_normal",
        state: "offered",
        ...overrides,
    };
}

describe("buildOfferChoices", () => {
    it("returns accept, decline, and defer choices", () => {
        const choices = buildOfferChoices(CONFIG);
        expect(choices).toHaveLength(3);
        expect(choices[0]).toMatchObject({ value: "accept", text: "Accept" });
        expect(choices[1]).toMatchObject({ value: "decline", text: "No thanks" });
        expect(choices[2]).toMatchObject({ value: "defer", text: "Maybe later" });
    });
});

describe("buildJournalEntries", () => {
    it("returns empty label when no accepted challenges", () => {
        const entries = buildJournalEntries([], CONFIG);
        expect(entries).toHaveLength(1);
        expect(entries[0]?.text).toBe(CONFIG.journalEmptyLabel);
    });

    it("formats one entry per accepted challenge", () => {
        const challenges: Array<{ challenge: ChallengeInstance; npcName: string }> = [
            { challenge: makeChallenge({ state: "accepted", cause: "find_pet" }), npcName: "Elder Mira" },
        ];
        const entries = buildJournalEntries(challenges, CONFIG);
        expect(entries).toHaveLength(1);
        expect(entries[0]!.text).toContain("Elder Mira");
        expect(entries[0]!.text).toContain("find_pet");
    });

    it("formats multiple entries", () => {
        const challenges: Array<{ challenge: ChallengeInstance; npcName: string }> = [
            { challenge: makeChallenge({ state: "accepted", cause: "find_pet" }), npcName: "Mira" },
            { challenge: makeChallenge({ state: "accepted", cause: "fetch_item" }), npcName: "Bram" },
        ];
        const entries = buildJournalEntries(challenges, CONFIG);
        expect(entries).toHaveLength(2);
        expect(entries[0]!.text).toContain("Mira");
        expect(entries[1]!.text).toContain("Bram");
    });

    it("only includes accepted challenges (not resolved/degraded/offered)", () => {
        const challenges: Array<{ challenge: ChallengeInstance; npcName: string }> = [
            { challenge: makeChallenge({ state: "accepted" }), npcName: "Mira" },
            { challenge: makeChallenge({ state: "resolved" }), npcName: "Bram" },
            { challenge: makeChallenge({ state: "degraded" }), npcName: "Oak" },
        ];
        const entries = buildJournalEntries(challenges, CONFIG);
        expect(entries).toHaveLength(1);
        expect(entries[0]!.text).toContain("Mira");
    });
});

describe("pickPostResolveLine — T149 dialog degradation", () => {
    function makeLine(context: "challenge_thanks" | "idle_after_resolve", id: string): DialogLine {
        return {
            id,
            role: "farmer",
            context,
            mood: "warm",
            levelBand: 0,
            text: `${context} line`,
        };
    }

    function makeProfile(ns: number): NpcDialogProfile {
        return {
            npcSeed: ns,
            role: "farmer",
            greetings: [],
            ambients: [],
            rumors: [],
            challengeOffers: [],
            challengeThanks: [makeLine("challenge_thanks", "ct_1"), makeLine("challenge_thanks", "ct_2")],
            idleAfterResolve: [makeLine("idle_after_resolve", "iar_1")],
        };
    }

    it("resolved state → returns a challenge_thanks line", () => {
        const profile = makeProfile(1);
        const c = makeChallenge({ state: "resolved", resolvedDay: 5 });
        const line = pickPostResolveLine(c, profile, 15);
        expect(line?.context).toBe("challenge_thanks");
    });

    it("degraded state → returns an idle_after_resolve line", () => {
        const profile = makeProfile(2);
        const c = makeChallenge({ state: "degraded", resolvedDay: 1 });
        const line = pickPostResolveLine(c, profile, 15);
        expect(line?.context).toBe("idle_after_resolve");
    });

    it("returns null for non-resolved/degraded states", () => {
        const profile = makeProfile(3);
        const c = makeChallenge({ state: "accepted" });
        const line = pickPostResolveLine(c, profile, 15);
        expect(line).toBeNull();
    });
});
