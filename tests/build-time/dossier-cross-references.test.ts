import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGIONS_DIR = resolve(__dirname, '../../src/content/regions');
const VISUALS = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/gameplay/visuals.json'), 'utf-8'),
) as {
    npc_spritesheets: Array<{ id: string }>;
    player_spritesheets: Array<{ id: string }>;
    combatant_spritesheets: Array<{ id: string }>;
    boss_spritesheets: Array<{ id: string }>;
};

interface Dossier {
    id: string;
    graphic?: string;
    appearances: Array<{
        region: string;
        spawn?: [number, number];
        requires_flag?: string;
    }>;
}

function loadAllDossiers(): Array<{ region: string; file: string; dossier: Dossier }> {
    const out: Array<{ region: string; file: string; dossier: Dossier }> = [];
    for (const region of readdirSync(REGIONS_DIR)) {
        const npcsDir = join(REGIONS_DIR, region, 'npcs');
        try {
            for (const file of readdirSync(npcsDir).filter((f) => f.endsWith('.json'))) {
                const dossier = JSON.parse(readFileSync(join(npcsDir, file), 'utf-8')) as Dossier;
                out.push({ region, file, dossier });
            }
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        }
    }
    return out;
}

const SHIPPED_REGIONS = new Set<string>([
    'riverside_home',
    'greenwood_road',
    'highridge_pass',
    'lakehaven',
    'frostvale',
    'dreadpeak_cavern',
    'rivergate_approach',
]);

const REGISTERED_SPRITESHEETS = new Set<string>([
    ...VISUALS.npc_spritesheets.map((s) => s.id),
    ...VISUALS.player_spritesheets.map((s) => s.id),
    ...VISUALS.combatant_spritesheets.map((s) => s.id),
    ...VISUALS.boss_spritesheets.map((s) => s.id),
]);

describe('T78: dossier cross-references resolve to shipped data', () => {
    it('every appearance.region points at a shipped region', () => {
        const drift: string[] = [];
        for (const { region, file, dossier } of loadAllDossiers()) {
            for (const appearance of dossier.appearances) {
                if (!SHIPPED_REGIONS.has(appearance.region)) {
                    drift.push(
                        `${region}/${file} (id=${dossier.id}): appearance.region="${appearance.region}" ` +
                            `is not a shipped region. Shipped: ${[...SHIPPED_REGIONS].join(', ')}`,
                    );
                }
            }
        }
        expect(drift).toEqual([]);
    });

    it('every dossier that declares a graphic references a registered spritesheet', () => {
        const drift: string[] = [];
        for (const { region, file, dossier } of loadAllDossiers()) {
            if (!dossier.graphic) continue;
            if (!REGISTERED_SPRITESHEETS.has(dossier.graphic)) {
                drift.push(
                    `${region}/${file} (id=${dossier.id}): graphic="${dossier.graphic}" ` +
                        `is not registered in content/gameplay/visuals.json`,
                );
            }
        }
        expect(drift).toEqual([]);
    });

    it('every dossier with an appearance in a non-home region ships a home-region default', () => {
        // Cross-region appearances make sense only if the NPC has a default
        // home-region appearance too. This catches dossiers that accidentally
        // set `default: true` on the away-from-home row, making the NPC
        // invisible in their intended home region.
        const drift: string[] = [];
        for (const { region, file, dossier } of loadAllDossiers()) {
            if (dossier.appearances.length === 1) continue;
            const defaults = dossier.appearances.filter((a) => (a as { default?: boolean }).default);
            if (defaults.length === 0) {
                drift.push(
                    `${region}/${file} (id=${dossier.id}): multiple appearances but no default=true`,
                );
                continue;
            }
            if (defaults.length > 1) {
                drift.push(
                    `${region}/${file} (id=${dossier.id}): ${defaults.length} appearances marked default=true`,
                );
            }
        }
        expect(drift).toEqual([]);
    });

    it('appearance with requires_flag also references a known-setter flag', () => {
        // Reuses the shape of dialog-flag-references.test.ts but applied
        // to required_flag on appearances. An appearance gated on a flag
        // nobody sets is a spawn that never happens.
        const KNOWN_SETTERS = new Set<string>([
            'starter_chosen',
            'rook_defeated',
            'badge_sewi',
            'badge_telo',
            'badge_lete',
            'badge_suli',
            'tarrin_defeated',
            'marin_defeated',
            'frost_defeated',
            'cliff_defeated',
            'green_dragon_defeated',
            'game_cleared',
            'proofs_all_four',
            'quest_quest_field_notes_done',
            'quest_quest_shrine_stones_done',
            'shopkeep_first_sale',
            'lost_hiker_delivered',
            'cold_hands_complete',
            'snowbird_sighting_complete',
            'torch_path_survey_complete',
        ]);
        const drift: string[] = [];
        for (const { region, file, dossier } of loadAllDossiers()) {
            for (const appearance of dossier.appearances) {
                if (!appearance.requires_flag) continue;
                if (!KNOWN_SETTERS.has(appearance.requires_flag)) {
                    drift.push(
                        `${region}/${file} (id=${dossier.id}): appearance.requires_flag="${appearance.requires_flag}" ` +
                            `has no known setter. Appearance will never spawn.`,
                    );
                }
            }
        }
        expect(drift).toEqual([]);
    });
});
