import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * T11-10 — jan Sewi first-play cue.
 *
 * Asserts the JanSewi event definition:
 *   1. Attaches a "!" components-top layout when `starter_chosen` flag
 *      is unset (fresh save, opening scene just ended).
 *   2. Does NOT attach the cue when `starter_chosen` is already set
 *      (returning player, ceremony already ran).
 *   3. Clears the cue inside onAction after the ceremony runs, so
 *      subsequent talks don't keep the "!" visible.
 *
 * The diegetic cue is the v1 onboarding fix: once the scripted opening
 * ends and control passes back to the player, Rivers should see one
 * bright glyph over jan Sewi and nothing else — no tutorial overlay,
 * no arrow, no text. Pokémon / FFVI / Chrono Trigger all lean on this
 * glyph to point the player at the next beat.
 */

vi.mock('../../src/platform/persistence/queries', () => ({
    getFlag: vi.fn(),
}));

vi.mock('../../src/modules/main/starter-ceremony', () => ({
    runStarterCeremony: vi.fn().mockResolvedValue(undefined),
}));

import { getFlag } from '../../src/platform/persistence/queries';
import { runStarterCeremony } from '../../src/modules/main/starter-ceremony';
import { JanSewi } from '../../src/modules/main/event';
import { STARTER_CEREMONY_CONFIG } from '../../src/content/gameplay';

type SetComponentsCall = [unknown, unknown];

function makeFakeEvent() {
    const setGraphic = vi.fn();
    const setComponentsTop = vi.fn();
    return {
        context: {
            setGraphic,
            setComponentsTop,
            get componentsTopCalls(): SetComponentsCall[] {
                return setComponentsTop.mock.calls as SetComponentsCall[];
            },
        },
    };
}

function firstCueCall(calls: SetComponentsCall[]) {
    return calls.find(([layout]) => {
        if (!layout || typeof layout !== 'object') return false;
        const node = layout as { type?: string; value?: string };
        return node.type === 'text' && node.value === '!';
    });
}

function clearCall(calls: SetComponentsCall[]) {
    return calls.find(([layout]) => Array.isArray(layout) && layout.length === 0);
}

describe('JanSewi first-play cue', () => {
    beforeEach(() => {
        vi.mocked(getFlag).mockReset();
        vi.mocked(runStarterCeremony).mockClear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('attaches the "!" cue on first play (starter_chosen flag unset)', async () => {
        vi.mocked(getFlag).mockResolvedValue(null);
        const definition = JanSewi();
        const { context } = makeFakeEvent();

        // The `this`-bound invocation pattern is how RPG.js invokes
        // event hooks at runtime. We don't pass the event as the first
        // arg because the existing JanSewi implementation only uses
        // `this` (see src/modules/main/event.ts).
        const onInit = definition.onInit as unknown as (this: typeof context) => Promise<void>;
        await onInit.call(context);

        expect(context.setGraphic).toHaveBeenCalledWith(
            STARTER_CEREMONY_CONFIG.mentorGraphic,
        );
        expect(getFlag).toHaveBeenCalledWith('starter_chosen');

        const cue = firstCueCall(context.componentsTopCalls);
        expect(cue, 'first-play cue should have been attached').toBeDefined();

        // Confirm the style is visually distinctive (gold fill + dark
        // stroke). This isn't about locking down the palette — it's
        // about asserting the style is *not* default so the glyph
        // actually pops against the tileset. If the palette changes,
        // update this test; don't drop the assertion.
        const [layout, options] = cue!;
        const node = layout as { style?: { fill?: string; stroke?: string } };
        expect(node.style?.fill).toBeTruthy();
        expect(node.style?.stroke).toBeTruthy();
        expect(options).toBeDefined();
    });

    it('does NOT attach the cue when starter_chosen is already set', async () => {
        vi.mocked(getFlag).mockResolvedValue('1');
        const definition = JanSewi();
        const { context } = makeFakeEvent();

        const onInit = definition.onInit as unknown as (this: typeof context) => Promise<void>;
        await onInit.call(context);

        expect(firstCueCall(context.componentsTopCalls)).toBeUndefined();
    });

    it('clears the cue after onAction completes', async () => {
        vi.mocked(getFlag).mockResolvedValue(null);
        const definition = JanSewi();
        const { context } = makeFakeEvent();

        const onInit = definition.onInit as unknown as (this: typeof context) => Promise<void>;
        await onInit.call(context);
        expect(firstCueCall(context.componentsTopCalls)).toBeDefined();

        // Simulate the player walking up and pressing action.
        const fakePlayer = {} as never;
        const onAction = definition.onAction as unknown as (
            this: typeof context,
            player: unknown,
        ) => Promise<void>;
        await onAction.call(context, fakePlayer);

        expect(runStarterCeremony).toHaveBeenCalledWith(fakePlayer);
        expect(
            clearCall(context.componentsTopCalls),
            'onAction should clear the cue by passing an empty layout',
        ).toBeDefined();
    });
});
