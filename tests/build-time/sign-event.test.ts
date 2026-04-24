import { describe, it, expect } from 'vitest';
import { SignEvent } from '../../src/modules/main/sign';
import type { RpgPlayer } from '@rpgjs/server';

/**
 * T83: SignEvent accepts an optional title that threads through
 * DialogOptions.speaker so the rr-ui surface renders the sign's
 * heading as a labeled speaker line.
 */

function makePlayerSpy() {
    const calls: Array<{ message: string; options?: { speaker?: string } }> = [];
    const player = {
        showText: async (message: string, options?: { speaker?: string }) => {
            calls.push({ message, options });
            return 0;
        },
    } as unknown as RpgPlayer;
    return { player, calls };
}

describe('T83: SignEvent', () => {
    it('calls showText with only body when no title is provided', async () => {
        const { player, calls } = makePlayerSpy();
        const event = SignEvent('Nothing grand, just a plank.');
        const onAction = event.onAction as (p: RpgPlayer) => Promise<void>;
        await onAction(player);
        expect(calls).toHaveLength(1);
        expect(calls[0]!.message).toBe('Nothing grand, just a plank.');
        expect(calls[0]!.options).toBeUndefined();
    });

    it('passes title through DialogOptions.speaker when provided', async () => {
        const { player, calls } = makePlayerSpy();
        const event = SignEvent(
            'Where the river remembers your name.',
            'RIVERSIDE HOME',
        );
        const onAction = event.onAction as (p: RpgPlayer) => Promise<void>;
        await onAction(player);
        expect(calls).toHaveLength(1);
        expect(calls[0]!.message).toBe('Where the river remembers your name.');
        expect(calls[0]!.options).toEqual({ speaker: 'RIVERSIDE HOME' });
    });

    it('empty title falls back to no-speaker path (defensive)', async () => {
        const { player, calls } = makePlayerSpy();
        // Empty string is falsy — the branch that passes options skips.
        // Prevents accidental blank speaker labels in the UI.
        const event = SignEvent('Body.', '');
        const onAction = event.onAction as (p: RpgPlayer) => Promise<void>;
        await onAction(player);
        expect(calls[0]!.options).toBeUndefined();
    });
});
