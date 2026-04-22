import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { species } from '../../src/content/schema/species';
import { move } from '../../src/content/schema/move';
import { item } from '../../src/content/schema/item';
import { dialogNode } from '../../src/content/schema/dialog';
import { journey } from '../../src/content/schema/journey';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');
const SPINE = join(ROOT, 'src/content/spine');

function listJsonFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...listJsonFiles(full));
        else if (entry.endsWith('.json')) out.push(full);
    }
    return out;
}

function readJson(path: string): unknown {
    return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('T6-02: every spine JSON parses against its Zod schema', () => {
    it('species files all validate', () => {
        const files = listJsonFiles(join(SPINE, 'species'));
        expect(files.length).toBeGreaterThan(0);
        for (const f of files) {
            const result = species.safeParse(readJson(f));
            if (!result.success) {
                throw new Error(`${f}: ${JSON.stringify(result.error.issues, null, 2)}`);
            }
        }
    });

    it('moves files all validate', () => {
        const files = listJsonFiles(join(SPINE, 'moves'));
        expect(files.length).toBeGreaterThan(0);
        for (const f of files) {
            const result = move.safeParse(readJson(f));
            if (!result.success) {
                throw new Error(`${f}: ${JSON.stringify(result.error.issues, null, 2)}`);
            }
        }
    });

    it('items files all validate', () => {
        const files = listJsonFiles(join(SPINE, 'items'));
        expect(files.length).toBeGreaterThan(0);
        for (const f of files) {
            const result = item.safeParse(readJson(f));
            if (!result.success) {
                throw new Error(`${f}: ${JSON.stringify(result.error.issues, null, 2)}`);
            }
        }
    });

    it('dialog files all validate (each file is an array of nodes)', () => {
        const files = listJsonFiles(join(SPINE, 'dialog'));
        expect(files.length).toBeGreaterThan(0);
        for (const f of files) {
            const raw = readJson(f);
            const arr = Array.isArray(raw) ? raw : [raw];
            for (const node of arr) {
                const result = dialogNode.safeParse(node);
                if (!result.success) {
                    throw new Error(`${f}: ${JSON.stringify(result.error.issues, null, 2)}`);
                }
            }
        }
    });

    it('journey.json validates', () => {
        const result = journey.safeParse(readJson(join(SPINE, 'journey.json')));
        if (!result.success) {
            throw new Error(`journey.json: ${JSON.stringify(result.error.issues, null, 2)}`);
        }
    });

    it('expected total count: 43 species, 17 moves, 5 items', () => {
        const speciesFiles = listJsonFiles(join(SPINE, 'species'));
        const moveFiles = listJsonFiles(join(SPINE, 'moves'));
        const itemFiles = listJsonFiles(join(SPINE, 'items'));
        expect(speciesFiles).toHaveLength(43);
        expect(moveFiles).toHaveLength(17);
        expect(itemFiles).toHaveLength(5);
    });
});
