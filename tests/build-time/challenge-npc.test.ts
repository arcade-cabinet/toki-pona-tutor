import { describe, expect, it } from "vitest";
import {
    buildOfferChoices,
    buildJournalEntries,
    type ChallengeOfferConfig,
    type JournalEntry,
} from "../../src/modules/main/challenge-npc";
import type { ChallengeInstance } from "../../src/modules/challenge-template";

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

    it("only includes accepted (not resolved/degraded) challenges", () => {
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
