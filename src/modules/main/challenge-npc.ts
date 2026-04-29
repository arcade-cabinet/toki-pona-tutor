/**
 * Challenge NPC runtime — offer UI, journal, and chunk-delta state transitions.
 *
 * Pure helpers (buildOfferChoices, buildJournalEntries) are testable without
 * RPG.js. The RPG.js wiring (offerChallengeToPlayer) lives here too and is
 * exercised by integration tests.
 *
 * Per docs/QUESTS.md § Challenge dialog composition.
 */

import type { RpgPlayer } from "@rpgjs/server";
import { CHALLENGE_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import {
    offerChallenge,
    acceptChallenge,
    declineChallenge,
} from "../challenge-lifecycle";
import type { ChallengeInstance } from "../challenge-template";
import type { NpcDialogProfile } from "../dialog-pool";
import { pickLine } from "../dialog-pool";
import { loadChunkDelta, persistChunkDelta, type ChunkDelta } from "../chunk-store";
import type { ChunkCoord } from "../world-generator";
import type { Seed } from "../seed";

export type ChallengeOfferConfig = {
    acceptLabel: string;
    declineLabel: string;
    deferLabel: string;
    journalEntryTemplate: string;
    journalEmptyLabel: string;
    journalSectionLabel: string;
};

export type JournalEntry = {
    text: string;
};

type OfferChoice = {
    text: string;
    value: "accept" | "decline" | "defer";
};

/** Pure: builds the three accept/decline/defer choices for showChoices. */
export function buildOfferChoices(config: ChallengeOfferConfig): OfferChoice[] {
    return [
        { text: config.acceptLabel, value: "accept" },
        { text: config.declineLabel, value: "decline" },
        { text: config.deferLabel, value: "defer" },
    ];
}

/** Pure: formats journal entries from accepted challenges only. */
export function buildJournalEntries(
    challenges: Array<{ challenge: ChallengeInstance; npcName: string }>,
    config: ChallengeOfferConfig,
): JournalEntry[] {
    const active = challenges.filter((e) => e.challenge.state === "accepted");
    if (active.length === 0) {
        return [{ text: config.journalEmptyLabel }];
    }
    return active.map((e) => ({
        text: formatGameplayTemplate(config.journalEntryTemplate, {
            npc: e.npcName,
            cause: e.challenge.cause,
        }),
    }));
}

/** NPC key for chunk-delta indexing: `"<spawnX>:<spawnY>"`. */
export function npcKey(spawnX: number, spawnY: number): string {
    return `${spawnX}:${spawnY}`;
}

function emptyDelta(): ChunkDelta {
    return {
        openedChestIds: [],
        despawnedNpcIds: [],
        resolvedChallengeIds: [],
        challengeStates: {},
    };
}

/**
 * Load or initialize the challenge instance for an NPC from the chunk delta.
 * Returns the challenge with its persisted state, or the original (pending)
 * challenge if the NPC has not been visited before.
 */
export async function loadNpcChallenge(
    seed: Seed,
    coord: ChunkCoord,
    key: string,
    challenge: ChallengeInstance,
): Promise<ChallengeInstance> {
    const delta = await loadChunkDelta(seed, coord);
    const state = delta?.challengeStates[key];
    if (!state) return challenge;
    return { ...challenge, state };
}

/** Persist the challenge state for an NPC into the chunk delta. */
export async function persistNpcChallenge(
    seed: Seed,
    coord: ChunkCoord,
    key: string,
    challenge: ChallengeInstance,
): Promise<void> {
    const existing = await loadChunkDelta(seed, coord) ?? emptyDelta();
    await persistChunkDelta(seed, coord, {
        ...existing,
        challengeStates: {
            ...existing.challengeStates,
            [key]: challenge.state,
        },
    });
}

/**
 * Run the challenge offer UI for one NPC interaction.
 * Reads current state from chunk delta, shows dialog + choices, persists result.
 *
 * Returns the final challenge state after interaction.
 */
export async function offerChallengeToPlayer(
    player: RpgPlayer,
    challenge: ChallengeInstance,
    profile: NpcDialogProfile,
    seed: Seed,
    coord: ChunkCoord,
    spawnX: number,
    spawnY: number,
    currentDay: number,
    playerLevel: number,
): Promise<ChallengeInstance> {
    const key = npcKey(spawnX, spawnY);
    let current = await loadNpcChallenge(seed, coord, key, challenge);

    // Transition to offered state on interaction
    current = offerChallenge(current, currentDay);

    // Pick offer line from NPC's profile
    const line = pickLine(profile, "challenge_offer", playerLevel);
    const offerText = line?.text ?? CHALLENGE_UI_CONFIG.resolveFallback;

    await player.showText(`${offerText}\n${CHALLENGE_UI_CONFIG.offerFooter}`);

    const choices = buildOfferChoices(CHALLENGE_UI_CONFIG);
    const result = await player.showChoices(
        offerText,
        choices.map((c) => ({ text: c.text, value: c.value })),
    );
    const value = (result?.value as "accept" | "decline" | "defer" | undefined) ?? "defer";

    if (value === "accept") {
        current = acceptChallenge(current, currentDay);
    } else if (value === "decline") {
        current = declineChallenge(current);
    }
    // defer leaves state as offered

    await persistNpcChallenge(seed, coord, key, current);
    return current;
}
