import { afterEach, describe, expect, it } from 'vitest';
import { clear, testing, type TestingFixture } from '@rpgjs/testing';
import { Container, h } from 'canvasengine';
import { type RpgPlayer } from '@rpgjs/server';
import server from '../../src/modules/main/server';
import { COMBAT_FAINT_ANIMATION_ID } from '../../src/modules/main/combat-visuals';
import { LEAD_MOVE_BAR_GUI_ID } from '../../src/modules/main/lead-battle-skills';
import { WILD_BATTLE_GUI_ID } from '../../src/modules/main/wild-battle-view';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import { setFlag } from '../../src/platform/persistence/queries';

type GameClient = Awaited<ReturnType<TestingFixture['createClient']>>;

/**
 * T67: prove the dossier NPC runtime pipeline (T64 selector + T65 spawning)
 * works end-to-end against a real RPG.js engine. Unit tests cover the pure
 * pieces; this test catches pipeline regressions where the parts work
 * individually but the wiring between them drifts.
 *
 * Uses rook's Rivergate appearance because it exercises the whole stack:
 *   - Dossier NPC with required_flag (badge_suli) → T65 interaction gate
 *   - Multiple dialog states with different when_flags → T64 selector
 *   - home_region=greenwood_road + cross-region appearance → dossier-merge
 *
 * Flow:
 *   1. Boot into rivergate_approach.
 *   2. Assert npc-rook is spawned (the dossier-merge + server wiring worked).
 *   3. Pre-badge_suli: onAction is a silent no-op.
 *   4. After setFlag('badge_suli'): onAction plays rook_intro (primary state).
 *   5. After setFlag('rook_defeated'): onAction plays rook_victory (selector
 *      picks the higher-priority matching state).
 */
afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
    await clear();
});

describe('T67: dossier NPC runtime pipeline (integration)', () => {
    it('npc-rook at rivergate gates on badge_suli, then plays flag-appropriate state', async () => {
        const { player } = await bootAtRivergate();
        const ui = hijackUi(player);
        const map = player.getCurrentMap();
        const rook = map?.getEvent('npc-rook');
        expect(rook, 'dossier spawning should register npc-rook (T65)').toBeDefined();

        // Phase 1: pre-gate. Silent no-op.
        ui.texts.length = 0;
        await rook!.execMethod('onAction', [player]);
        expect(ui.texts, 'pre-badge_suli onAction should be silent').toEqual([]);

        // Phase 2: open the gate. Primary state (rook_intro) plays.
        // rook_intro beats live in src/content/regions/greenwood_road/npcs/rook.json
        // dialog_states[0] — snapshot here asserts content actually flowed.
        await setFlag('badge_suli', '1');
        ui.texts.length = 0;
        await rook!.execMethod('onAction', [player]);
        expect(ui.texts).toEqual([
            "You've made it past the village. Let's see what your companion can do.",
            "I'm not going easy on you.",
        ]);

        // Phase 3: set rook_defeated. Selector picks rook_victory
        // (its when_flags { rook_defeated: true, badge_sewi: false } match
        // and priority > rook_intro).
        await setFlag('rook_defeated', '1');
        ui.texts.length = 0;
        await rook!.execMethod('onAction', [player]);
        expect(ui.texts).toEqual([
            'You handled yourself.',
            'Greenwood Road is yours.',
        ]);
    });
});

async function bootAtRivergate(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const fixture = await testing(integrationModules());
    const client = await fixture.createClient();
    const player = await client.waitForMapChange('riverside_home', 5000);
    // Teleport straight to rivergate_approach — the dossier NPC only exists on
    // this map, and the golden-path bootIntoFinalRoute() helper runs the full
    // gym chain, which is overkill for this focused test.
    const waitForRivergate = client.waitForMapChange('rivergate_approach', 5000);
    await player.changeMap('rivergate_approach', { x: 32, y: 112 });
    const rivergatePlayer = await waitForRivergate;
    return { client, player: rivergatePlayer };
}

function integrationModules() {
    return [{
        server,
        client: {
            gui: [{
                id: WILD_BATTLE_GUI_ID,
                component: () => h(Container, {}),
            }, {
                id: LEAD_MOVE_BAR_GUI_ID,
                component: () => h(Container, {}),
            }],
            componentAnimations: [{
                id: COMBAT_FAINT_ANIMATION_ID,
                component: () => h(Container, {}),
            }],
        },
    }];
}

function hijackUi(player: RpgPlayer) {
    const texts: string[] = [];
    const mutable = player as unknown as {
        showText: (message: string) => Promise<number>;
    };
    mutable.showText = async (message: string) => {
        texts.push(String(message));
        return 0;
    };
    return { texts };
}
