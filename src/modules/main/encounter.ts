import type { RpgPlayer } from '@rpgjs/server';
import { addToParty, logEncounter, recordMasteredWord, getParty, awardXpToLead } from '../../platform/persistence/queries';
import { playDialog } from './dialog';
import { gainXp } from './xp-curve';
import { movesLearnedAtLevel } from './content';
import worldRaw from '../../content/generated/world.json';

type Species = {
    id: string;
    name: { en: string; tp?: string };
    catch_rate: number;
    xp_yield: number;
};

const species = (worldRaw as unknown as { species: Species[] }).species;

/** Random integer in [min, max], inclusive. */
function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a species id from a weighted table. */
function rollSpeciesId(table: Record<string, number>): string | null {
    const entries = Object.entries(table);
    if (entries.length === 0) return null;
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let pick = Math.random() * total;
    for (const [id, weight] of entries) {
        pick -= weight;
        if (pick <= 0) return id;
    }
    return entries[entries.length - 1][0];
}

/** Parse a Tiled Encounter shape into structured fields. Safe no-op on bad data. */
function parseEncounterShape(properties: Record<string, unknown>): {
    table: Record<string, number>;
    levelMin: number;
    levelMax: number;
} | null {
    const speciesRaw = properties.species;
    const levelMin = Number(properties.level_min ?? 3);
    const levelMax = Number(properties.level_max ?? 6);
    if (typeof speciesRaw !== 'string') return null;
    try {
        const table = JSON.parse(speciesRaw) as Record<string, number>;
        return { table, levelMin, levelMax };
    } catch {
        return null;
    }
}

const ENCOUNTER_PROBABILITY_PER_STEP = 0.12;

function lookupSpecies(id: string): Species | undefined {
    return species.find((s) => s.id === id);
}

/**
 * Fires when the player enters an Encounter shape. Rolls whether an
 * encounter happens (simple per-enter coin flip scaled by table density),
 * picks a species + level, and runs the capture-or-flee prompt.
 */
export async function handleEncounterShapeEntered(
    player: RpgPlayer,
    properties: Record<string, unknown>,
    mapId: string,
): Promise<void> {
    if (Math.random() > ENCOUNTER_PROBABILITY_PER_STEP) return;
    const parsed = parseEncounterShape(properties);
    if (!parsed) return;

    const speciesId = rollSpeciesId(parsed.table);
    if (!speciesId) return;
    const meta = lookupSpecies(speciesId);
    if (!meta) return;

    const level = randInt(parsed.levelMin, parsed.levelMax);
    await runCaptureDialog(player, meta, level, mapId);
}

async function runCaptureDialog(
    player: RpgPlayer,
    meta: Species,
    level: number,
    mapId: string,
): Promise<void> {
    await playDialog(player, 'wild_encounter_appear');
    await recordMasteredWord(meta.id.split('_')[0]);

    const choice = await player.showChoices('?', [
        { text: 'poki', value: 'catch' },
        { text: 'tawa', value: 'flee' },
    ]);

    if (!choice || choice.value === 'flee') {
        await logEncounter(meta.id, mapId, 'fled');
        return;
    }

    const caught = Math.random() < meta.catch_rate;
    if (caught) {
        const slot = await addToParty(meta.id, level);
        if (slot === null) {
            // Party is full — treat as a failed catch so the dialog and log
            // reflect what actually happened (nothing was added to the roster).
            await playDialog(player, 'wild_encounter_escaped');
            await logEncounter(meta.id, mapId, 'fled');
            return;
        }
        await playDialog(player, 'wild_encounter_caught');
        await logEncounter(meta.id, mapId, 'caught');
        // Wild capture grants the lead party creature half the species'
        // xp_yield (catching is less risky than defeating, so less xp).
        await grantLeadXp(player, Math.floor(meta.xp_yield / 2));
    } else {
        await playDialog(player, 'wild_encounter_escaped');
        await logEncounter(meta.id, mapId, 'escaped');
    }
}

async function grantLeadXp(player: RpgPlayer, amount: number): Promise<void> {
    if (amount <= 0) return;
    const party = await getParty();
    const lead = party[0];
    if (!lead) return;
    const { xp, levelUps } = gainXp(lead.xp, amount);
    const newLevel = levelUps.length ? levelUps[levelUps.length - 1].to : lead.level;
    await awardXpToLead(xp, newLevel);
    await player.showText(`+${amount} xp`);
    for (const lvl of levelUps) {
        await player.showText(`${lead.species_id} L${lvl.from} → L${lvl.to}`);
        for (const moveId of movesLearnedAtLevel(lead.species_id, lvl.to)) {
            await player.showText(`learned: ${moveId}`);
        }
    }
}
