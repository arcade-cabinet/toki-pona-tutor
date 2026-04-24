import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGIONS_DIR = resolve(__dirname, '../../src/content/regions');

interface Dossier {
    id: string;
    dialog_states: Array<{ id: string }>;
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

/**
 * T86: lock the dossier state id convention. Every dialog_state.id must
 * start with the owning NPC's id, followed by an underscore. Ship
 * examples: `rook_intro`, `loren_hiker_arrives`, `cormorant_post_sighting`.
 *
 * Why the convention matters:
 *   - globally unique dialog node ids across the whole compiled pool
 *   - trivially grep-able: `grep -r loren_` finds every Loren beat
 *   - playDialog + selectDialogState rely on nothing but the id, so a
 *     stray `intro` that shadows another NPC's state would silently
 *     route the wrong beats
 *
 * Also assert state ids are globally unique across all dossiers — the
 * compile step does not dedupe, so two dossiers shipping the same id
 * produces a runtime lookup ambiguity.
 */
describe('T86: dossier state id convention', () => {
    it('every state.id starts with <npc.id>_', () => {
        const drift: string[] = [];
        for (const { region, file, dossier } of loadAllDossiers()) {
            for (const state of dossier.dialog_states) {
                if (!state.id.startsWith(`${dossier.id}_`)) {
                    drift.push(
                        `${region}/${file}: state.id "${state.id}" does not start with "${dossier.id}_"`,
                    );
                }
            }
        }
        expect(drift).toEqual([]);
    });

    it('state ids are globally unique across all dossiers', () => {
        const seen = new Map<string, { region: string; file: string }>();
        const duplicates: string[] = [];
        for (const { region, file, dossier } of loadAllDossiers()) {
            for (const state of dossier.dialog_states) {
                const prior = seen.get(state.id);
                if (prior) {
                    duplicates.push(
                        `state.id "${state.id}" in ${region}/${file} duplicates ${prior.region}/${prior.file}`,
                    );
                } else {
                    seen.set(state.id, { region, file });
                }
            }
        }
        expect(duplicates).toEqual([]);
    });

    it('state ids are snake_case (lowercase + underscores + digits)', () => {
        const drift: string[] = [];
        const pattern = /^[a-z][a-z0-9_]*$/;
        for (const { region, file, dossier } of loadAllDossiers()) {
            for (const state of dossier.dialog_states) {
                if (!pattern.test(state.id)) {
                    drift.push(`${region}/${file}: state.id "${state.id}" is not snake_case`);
                }
            }
        }
        expect(drift).toEqual([]);
    });
});
