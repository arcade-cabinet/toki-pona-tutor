import { describe, expect, it, vi } from 'vitest';

/**
 * T11-02 — player name tag.
 *
 * The PC uses the same Fan-tasy art family as the village NPCs, so
 * without an overhead label Rivers is visually indistinct from the
 * crowd (flagged by the 1.0 onboarding capture). This test locks
 * down the contract that `applyPlayerNameTag`:
 *   1. Uses RPG.js `setComponentsTop` (the supported overlay API).
 *   2. Writes the configured name from PLAYER_CONFIG — "Rivers" today,
 *      but the test reads from config so a future rename flows through
 *      without breaking the test.
 *   3. Attaches a text component (not a bar, shape, or image).
 *
 * The test does not lock the exact style values — a designer can tune
 * those without breaking the test — but does assert that style fields
 * are populated so the tag stays visually distinct.
 */

import { applyPlayerNameTag } from '../../src/modules/main/player-identity';
import { PLAYER_CONFIG } from '../../src/content/gameplay';

describe('applyPlayerNameTag', () => {
    it('attaches a text component carrying the configured player name', () => {
        const setComponentsTop = vi.fn();
        const player = { setComponentsTop } as unknown as Parameters<
            typeof applyPlayerNameTag
        >[0];

        applyPlayerNameTag(player);

        expect(setComponentsTop).toHaveBeenCalledTimes(1);
        const [layout, options] = setComponentsTop.mock.calls[0]!;

        // Layout must be a text component addressing the player by name.
        expect(layout).toMatchObject({
            type: 'text',
            value: PLAYER_CONFIG.nameTag.text,
        });

        // Style must not be empty — otherwise the tag blends into the
        // tileset. We intentionally don't lock the exact fill/stroke
        // values so the palette can evolve.
        const node = layout as { style?: { fill?: string; stroke?: string } };
        expect(node.style?.fill).toBeTruthy();
        expect(node.style?.stroke).toBeTruthy();

        // Options must route the tag above the sprite (marginBottom
        // places it close to but above the spritesheet frame).
        expect(options).toBeDefined();
        expect(typeof (options as { marginBottom?: number }).marginBottom).toBe('number');
    });
});
