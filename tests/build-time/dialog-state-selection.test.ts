import { describe, it, expect } from 'vitest';
import { selectDialogState } from '../../src/modules/main/dialog';
import type { DialogNode } from '../../src/content/schema/dialog';

/**
 * T64: Flag-aware dialog state selector for dossier NPCs.
 *
 * These tests cover the pure selector directly — real dialog rules run
 * through playDialog, but the DB/flag dependency is mocked here by
 * passing in a flag lookup function.
 */

function makeNode(partial: Partial<DialogNode> & Pick<DialogNode, 'id' | 'npc_id'>): DialogNode {
    return {
        beats: [{ text: { en: `spoken by ${partial.id}` }, mood: 'thinking' }],
        priority: 0,
        ...partial,
    } as DialogNode;
}

function flagStore(flags: Record<string, string | null>) {
    return async (id: string) => (id in flags ? flags[id] : null);
}

describe('T64: selectDialogState', () => {
    it('returns null when the node has no npc_id (system / flat dialogs skip the selector)', async () => {
        const node = makeNode({ id: 'system_msg', npc_id: null });
        const result = await selectDialogState(node, [node], flagStore({}));
        expect(result).toBeNull();
    });

    it('returns null when the NPC has only one authored state', async () => {
        const only = makeNode({ id: 'solo_intro', npc_id: 'solo' });
        const result = await selectDialogState(only, [only], flagStore({}));
        expect(result).toBeNull();
    });

    it('prefers a matching higher-priority state over the primary', async () => {
        const intro = makeNode({
            id: 'cormorant_tuneup',
            npc_id: 'cormorant',
            when_flags: { snowbird_sighting_complete: false },
            priority: 0,
        });
        const post = makeNode({
            id: 'cormorant_post_sighting',
            npc_id: 'cormorant',
            when_flags: { snowbird_sighting_complete: true },
            priority: 5,
        });
        const flags = flagStore({ snowbird_sighting_complete: '1' });
        const result = await selectDialogState(intro, [intro, post], flags);
        expect(result?.id).toBe('cormorant_post_sighting');
    });

    it('falls back to the intro state when the post-condition flag is not yet set', async () => {
        const intro = makeNode({
            id: 'cormorant_tuneup',
            npc_id: 'cormorant',
            when_flags: { snowbird_sighting_complete: false },
            priority: 0,
        });
        const post = makeNode({
            id: 'cormorant_post_sighting',
            npc_id: 'cormorant',
            when_flags: { snowbird_sighting_complete: true },
            priority: 5,
        });
        const flags = flagStore({});
        const result = await selectDialogState(intro, [intro, post], flags);
        expect(result?.id).toBe('cormorant_tuneup');
    });

    it('treats "0" and empty string as unset (matches setFlag semantics for falsy)', async () => {
        const a = makeNode({
            id: 'a',
            npc_id: 'x',
            when_flags: { f: false },
        });
        const b = makeNode({
            id: 'b',
            npc_id: 'x',
            when_flags: { f: true },
        });
        for (const value of [null, '', '0'] as const) {
            const result = await selectDialogState(a, [a, b], flagStore({ f: value }));
            expect(result?.id, `value=${JSON.stringify(value)}`).toBe('a');
        }
        const set = await selectDialogState(a, [a, b], flagStore({ f: '1' }));
        expect(set?.id).toBe('b');
    });

    it('requires every when_flags entry to match (AND semantics)', async () => {
        const earlyMid = makeNode({
            id: 'mid_progress',
            npc_id: 'npc',
            when_flags: { badge_sewi: true, badge_suli: false },
            priority: 5,
        });
        const lateMid = makeNode({
            id: 'late_progress',
            npc_id: 'npc',
            when_flags: { badge_sewi: true, badge_suli: true },
            priority: 5,
        });
        const intro = makeNode({
            id: 'intro',
            npc_id: 'npc',
            when_flags: { badge_sewi: false },
            priority: 0,
        });
        // Player has first badge but not final — should get earlyMid.
        const r1 = await selectDialogState(intro, [intro, earlyMid, lateMid], flagStore({ badge_sewi: '1' }));
        expect(r1?.id).toBe('mid_progress');
        // Player has both badges — should get lateMid.
        const r2 = await selectDialogState(intro, [intro, earlyMid, lateMid], flagStore({ badge_sewi: '1', badge_suli: '1' }));
        expect(r2?.id).toBe('late_progress');
    });

    it('breaks priority ties by authoring order (earlier sibling wins)', async () => {
        const first = makeNode({ id: 'first', npc_id: 'z', priority: 3 });
        const second = makeNode({ id: 'second', npc_id: 'z', priority: 3 });
        const result = await selectDialogState(first, [first, second], flagStore({}));
        expect(result?.id).toBe('first');
    });

    it('returns null when no state matches (caller falls back to the requested node)', async () => {
        const a = makeNode({
            id: 'a',
            npc_id: 'x',
            when_flags: { f: true },
        });
        const b = makeNode({
            id: 'b',
            npc_id: 'x',
            when_flags: { f: false, g: true },
        });
        // f is unset → a fails; g is unset → b fails.
        const result = await selectDialogState(a, [a, b], flagStore({}));
        expect(result).toBeNull();
    });

    it('caches each flag lookup (same flag read once per selection pass)', async () => {
        let reads = 0;
        const lookup = async (id: string) => {
            reads += 1;
            return id === 'f' ? '1' : null;
        };
        const a = makeNode({ id: 'a', npc_id: 'x', when_flags: { f: true } });
        const b = makeNode({ id: 'b', npc_id: 'x', when_flags: { f: true, g: true } });
        const c = makeNode({ id: 'c', npc_id: 'x', when_flags: { f: false } });
        await selectDialogState(a, [a, b, c], lookup);
        // f is referenced by a, b, and c but should only be read once.
        // g is only referenced by b.
        expect(reads).toBe(2);
    });
});
