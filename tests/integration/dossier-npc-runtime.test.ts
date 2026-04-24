import { afterEach, describe, expect, it } from 'vitest';
import { clear, testing, type TestingFixture } from '@rpgjs/testing';
import { Container, h } from 'canvasengine';
import { type RpgPlayer } from '@rpgjs/server';
import server from '../../src/modules/main/server';
import { COMBAT_FAINT_ANIMATION_ID } from '../../src/modules/main/combat-visuals';
import { LEAD_MOVE_BAR_GUI_ID } from '../../src/modules/main/lead-battle-skills';
import { WILD_BATTLE_GUI_ID } from '../../src/modules/main/wild-battle-view';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import { setFlag, getFlag } from '../../src/platform/persistence/queries';

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
        ui.speakers.length = 0;
        await rook!.execMethod('onAction', [player]);
        expect(ui.texts).toEqual([
            "You've made it past the village. Let's see what your companion can do.",
            "I'm not going easy on you.",
        ]);
        // T81: every beat carries the NPC's display_name as speaker so the
        // UI can render 'Rook: ...' labels instead of bare lines.
        expect(ui.speakers).toEqual(['Rook', 'Rook']);

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

    it('loren_hiker_arrives fires on_exit set_flag and unlocks post-quest state (T71)', async () => {
        const { player } = await bootAtLakehaven();
        const ui = hijackUi(player);
        // Loren has a hand-authored quest_npc marker (jan-kala-lake) that
        // starts with dialog_id=loren_lake_quest. Because its id collides
        // with the dossier spawn, server.ts skips the dossier NPC here and
        // the quest_npc path plays Loren's dialog via playDialog. Either
        // way the flag-aware selector runs the same T64 rules.
        const map = player.getCurrentMap();
        const loren = map?.getEvent('jan-kala-lake');
        expect(loren, 'loren should spawn at lakehaven (either dossier or hand-authored)').toBeDefined();

        // Phase 1: pre-badge_sewi. Selector falls through to loren_lake_quest.
        ui.texts.length = 0;
        await loren!.execMethod('onAction', [player]);
        expect(ui.texts[0]).toBe('Lakehaven needs a runner with steady hands.');
        expect(await getFlag('lost_hiker_delivered')).toBeNull();

        // Phase 2: set badge_sewi (simulating player cleared Highridge).
        // Selector now picks loren_hiker_arrives (priority 10, both
        // when_flags match). On exit, lost_hiker_delivered fires.
        await setFlag('badge_sewi', '1');
        ui.texts.length = 0;
        await loren!.execMethod('onAction', [player]);
        expect(ui.texts[0]).toBe(
            "You came from Highridge, didn't you? And you're carrying the hiker's token.",
        );
        expect(await getFlag('lost_hiker_delivered')).toBe('1');

        // Phase 3: talk again. Now the turn-in state no longer matches
        // (lost_hiker_delivered is present, breaking its flag_absent gate).
        // loren_post_hiker picks up — badge_telo is still absent.
        ui.texts.length = 0;
        await loren!.execMethod('onAction', [player]);
        expect(ui.texts[0]).toBe(
            'We carried your Highridge hiker down to the warm stones. Marin said you\'d come through.',
        );
    });
});

async function bootAtLakehaven(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const fixture = await testing(integrationModules());
    const client = await fixture.createClient();
    const player = await client.waitForMapChange('riverside_home', 5000);
    const waitForLakehaven = client.waitForMapChange('lakehaven', 5000);
    await player.changeMap('lakehaven', { x: 96, y: 160 });
    const lakehavenPlayer = await waitForLakehaven;
    return { client, player: lakehavenPlayer };
}

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
    const speakers: Array<string | undefined> = [];
    const mutable = player as unknown as {
        showText: (message: string, options?: { speaker?: string }) => Promise<number>;
    };
    mutable.showText = async (message: string, options?: { speaker?: string }) => {
        texts.push(String(message));
        speakers.push(options?.speaker);
        return 0;
    };
    return { texts, speakers };
}
