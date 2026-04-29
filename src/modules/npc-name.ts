/**
 * NPC name generator — adjective+noun two-word names, role-clustered.
 * Per docs/DIALOG_POOL.md § Name generator.
 *
 * Pools: ~60 adjectives × ~80 nouns → ~4800 unique combinations.
 * Semantic clustering: different roles draw from different adjective subsets.
 */

import type { Role } from "./dialog-pool";
import { createRng } from "./seed";

// Noun pool (~80 names). Neutral, nature-themed, two syllables max.
const NOUNS = [
    "Pine", "Wren", "Ash", "Clay", "Fen", "Reed", "Birch", "Hazel", "Cove", "Flint",
    "Brook", "Drift", "Fern", "Glen", "Heath", "Hollow", "Moor", "Moss", "Ridge", "Slate",
    "Thicket", "Vale", "Burrow", "Cairn", "Dale", "Dusk", "Field", "Forge", "Frost",
    "Gale", "Holt", "Knoll", "Lake", "Lark", "Leaf", "Marsh", "Meadow", "Mist", "Peat",
    "Pool", "Root", "Rowe", "Rune", "Rush", "Sand", "Seam", "Shore", "Shrub", "Silt",
    "Spire", "Stone", "Strand", "Stream", "Thorn", "Tide", "Timber", "Trace", "Trail",
    "Twig", "Umber", "Wade", "Ward", "Weir", "Well", "Wold", "Wood", "Wort", "Yarrow",
    "Adder", "Amber", "Basalt", "Brace", "Clover", "Cobble", "Crest", "Ember", "Flare",
    "Gravel", "Grouse",
];

// Adjective clusters by NPC archetype
const ADJ_WARM = ["Warm", "Kind", "Gentle", "Soft", "Bright", "Sweet", "Dear", "Round"];
const ADJ_STURDY = ["Steady", "Firm", "Solid", "Strong", "Broad", "Iron", "Forge", "Rough"];
const ADJ_WEIGHTY = ["Faded", "Weathered", "Ancient", "Grey", "Deep", "Worn", "Still", "Slow"];
const ADJ_LIGHT = ["Bright", "Quick", "Swift", "Spare", "Small", "Young", "Keen", "Clear"];
const ADJ_NEUTRAL = [
    "Calm", "Even", "Fair", "Free", "Full", "Good", "Half", "Hardy", "High", "Late",
    "Lean", "Light", "Long", "Low", "Mute", "Near", "Neat", "New", "Old", "Open",
    "Plain", "Pure", "Rare", "Real", "Rich", "Round", "Safe", "Sharp", "Slim", "True",
    "Whole", "Wide", "Wild", "Wise", "Wry",
];

const ROLE_ADJECTIVES: Record<Role, string[]> = {
    guide: [...ADJ_WARM, ...ADJ_WEIGHTY],
    shopkeep: [...ADJ_WARM, ...ADJ_NEUTRAL],
    innkeep: [...ADJ_WARM, ...ADJ_NEUTRAL],
    elder: [...ADJ_WEIGHTY, ...ADJ_NEUTRAL],
    fisher: [...ADJ_NEUTRAL, ...ADJ_LIGHT],
    guard: [...ADJ_STURDY, ...ADJ_NEUTRAL],
    wanderer: [...ADJ_NEUTRAL, ...ADJ_LIGHT],
    farmer: [...ADJ_WARM, ...ADJ_NEUTRAL],
    hunter: [...ADJ_STURDY, ...ADJ_LIGHT],
    trainer: [...ADJ_STURDY, ...ADJ_NEUTRAL],
    rival: [...ADJ_STURDY, ...ADJ_WEIGHTY],
    child: [...ADJ_LIGHT, ...ADJ_WARM],
    villager_generic: [...ADJ_NEUTRAL, ...ADJ_WARM],
    shrine_keeper: [...ADJ_WEIGHTY, ...ADJ_NEUTRAL],
    historian: [...ADJ_WEIGHTY, ...ADJ_NEUTRAL],
};

function makeName(adj: string, noun: string): string {
    return `${adj} ${noun}`;
}

function pickForSpawn(seed: number, chunk: { x: number; y: number }, spawnIndex: number, role: Role, salt: number): string {
    const adjPool = ROLE_ADJECTIVES[role];
    const h = ((seed >>> 0) ^ ((chunk.x * 1000003) | 0) ^ ((chunk.y * 100003) | 0) ^ (spawnIndex * 31337) ^ salt) >>> 0;
    const rng = createRng(h, `npc-name:${role}`);
    const adj = rng.pick(adjPool);
    const noun = rng.pick(NOUNS);
    return makeName(adj, noun);
}

/**
 * Generate a deterministic two-word name for an NPC at (seed, chunk, spawnIndex, role).
 */
export function generateNpcName(
    seed: number,
    chunk: { x: number; y: number },
    spawnIndex: number,
    role: Role,
): string {
    return pickForSpawn(seed, chunk, spawnIndex, role, 0);
}

/**
 * Generate `count` unique names for NPCs in a village.
 * Re-rolls with increasing salt until all names are unique.
 */
export function generateVillageNpcNames(
    seed: number,
    chunk: { x: number; y: number },
    count: number,
    role: Role,
): string[] {
    const names: string[] = [];
    const seen = new Set<string>();
    let salt = 0;
    for (let i = 0; i < count; i++) {
        let name = pickForSpawn(seed, chunk, i, role, salt);
        while (seen.has(name)) {
            salt += 1;
            name = pickForSpawn(seed, chunk, i, role, salt);
        }
        seen.add(name);
        names.push(name);
    }
    return names;
}
