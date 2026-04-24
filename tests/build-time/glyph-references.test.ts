import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CLUES = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/clues.json'), 'utf-8'),
) as Array<{ id: string; label: string; summary: string; category: string; icon: string }>;

const WORLD = JSON.parse(
    readFileSync(resolve(__dirname, '../../src/content/generated/world.json'), 'utf-8'),
) as {
    dialog: Array<{ id: string; beats: Array<{ glyph?: string }> }>;
    signs: Array<{ region: string; body: { en: string }; title: string }>;
};

/**
 * T79: every glyph token referenced in dialog beats must have a
 * matching record in clues.json. Runtime recordClue() silently inserts
 * unknown glyph ids into the mastered_words table, but UI surfaces
 * (clue journal, interaction hint) only render clues that carry a
 * label/icon — so orphan glyphs become invisible "sightings" with no
 * player-visible record.
 *
 * The reverse (clue with no glyph reference) is intentional — some
 * clues are seeded by code paths (starter ceremony, gym-leader reward
 * clues) that don't flow through dialog.
 */

const CURATED_CLUE_IDS = new Set(CLUES.map((c) => c.id));

function collectGlyphsFromDialog(): Set<string> {
    const out = new Set<string>();
    for (const node of WORLD.dialog) {
        for (const beat of node.beats) {
            if (beat.glyph) out.add(beat.glyph);
        }
    }
    return out;
}

describe('T79: glyph references resolve to curated clues', () => {
    it('every glyph referenced in dialog beats exists in clues.json', () => {
        const referenced = collectGlyphsFromDialog();
        const missing = [...referenced].filter((glyph) => !CURATED_CLUE_IDS.has(glyph));
        expect(
            missing,
            `dialog beats reference ${missing.length} glyph(s) not in clues.json: ${missing.join(', ')}. ` +
                `Either add a clue record or drop the glyph — otherwise recordClue silently inserts an unlabeled row.`,
        ).toEqual([]);
    });

    it('every clue record has a non-empty label, summary, category, and icon', () => {
        for (const clue of CLUES) {
            expect(clue.id, `clue ${JSON.stringify(clue)}`).toMatch(/\S/);
            expect(clue.label, `clue ${clue.id} label`).toMatch(/\S/);
            expect(clue.summary, `clue ${clue.id} summary`).toMatch(/\S/);
            expect(clue.category, `clue ${clue.id} category`).toMatch(/\S/);
            expect(clue.icon, `clue ${clue.id} icon`).toMatch(/\S/);
        }
    });

    it('clue ids are unique', () => {
        const ids = CLUES.map((c) => c.id);
        const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
        expect(duplicates, `duplicate clue ids: ${duplicates.join(', ')}`).toEqual([]);
    });
});
