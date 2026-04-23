import { afterEach, describe, expect, it } from 'vitest';
import { clear, testing, type TestingFixture } from '@rpgjs/testing';
import { Container, h } from 'canvasengine';
import { type RpgPlayer } from '@rpgjs/server';
import server from '../../src/modules/main/server';
import { COMBAT_FAINT_ANIMATION_ID } from '../../src/modules/main/combat-visuals';
import { LEAD_MOVE_BAR_GUI_ID } from '../../src/modules/main/lead-battle-skills';
import { WILD_BATTLE_GUI_ID } from '../../src/modules/main/wild-battle-view';
import { runOpeningScene } from '../../src/modules/main/opening-scene';
import { startFreshGame } from '../../src/modules/main/title-menu';
import { OPENING_SCENE_CONFIG } from '../../src/content/gameplay';
import { preferences, KEYS } from '../../src/platform/persistence/preferences';
import { getFlag, getParty } from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';

type GameClient = Awaited<ReturnType<TestingFixture['createClient']>>;

type UiHarness = {
    texts: string[];
    notifications: string[];
    choose: (...values: Array<string | null>) => void;
};

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
    await clear();
});

/**
 * T11-06 / T11-07 — proves the onboarding chain works end-to-end
 * with no holes. Closes the gap surfaced by the T20 capture notes,
 * where clicking "New Game" dropped the player onto an empty map
 * with Party 0/6 and no scripted moment.
 *
 * The chain under test:
 *   startFreshGame()
 *     → runOpeningScene()
 *       → plays OPENING_SCENE_CONFIG.beats
 *       → chains into jan_sewi_starter_intro dialog
 *     → starter ceremony (player choose Ashcat / Mireling / Bramble)
 *       → party 0/6 → 1/6
 *       → starter_chosen flag set
 *       → opening_scene_complete flag set
 */
describe('opening scene integration', () => {
    it('New Game → opening beats → starter chosen → party 1/6 → flags set', async () => {
        const { player } = await bootGame();
        const ui = hijackUi(player);

        // Queue the starter choice before the chain runs — the starter
        // dialog's showChoices call will pick this up.
        ui.choose('kon_moli');

        // Fire the entry point that the title overlay calls. This is
        // the single bottleneck that every fresh-start flows through.
        await startFreshGame(player, { wipeExistingSaves: false });

        // Beat 1: the scripted opening played. Each beat reached showText.
        for (const beat of OPENING_SCENE_CONFIG.beats) {
            expect(
                ui.texts,
                `beat missing from showText log: "${beat}"`,
            ).toContain(beat);
        }

        // Beat 2: the starter ceremony ran to completion.
        expect(await preferences.get(KEYS.starterChosen)).toBe('kon_moli');
        expect(await getFlag('starter_chosen')).toBe('1');

        // Beat 3: the opening-scene flag is persisted so replay is
        // gated. This prevents a save/load from replaying the opening.
        expect(await getFlag(OPENING_SCENE_CONFIG.flagId)).toBe('1');

        // Beat 4: party 1/6 — this is the T11-07 acceptance.
        const party = await getParty();
        expect(party.length).toBe(1);
        expect(party[0]?.species_id).toBe('kon_moli');
    });

    it('is idempotent — runOpeningScene twice on the same save runs beats once', async () => {
        const { player } = await bootGame();
        const ui = hijackUi(player);
        ui.choose('kon_moli');

        // First call runs the full scripted arc and sets the flag.
        const firstDecision = await runOpeningScene(player);
        expect(firstDecision).toBe('play_full');
        const beatsOnFirstRun = OPENING_SCENE_CONFIG.beats.filter((b) =>
            ui.texts.includes(b),
        );
        expect(beatsOnFirstRun.length).toBe(OPENING_SCENE_CONFIG.beats.length);

        // Second call with the flag set: opening skips, no beats.
        ui.texts.length = 0;
        const secondDecision = await runOpeningScene(player);
        expect(secondDecision).toBe('skip_already_played');
        for (const beat of OPENING_SCENE_CONFIG.beats) {
            expect(
                ui.texts,
                `beat should not have replayed: "${beat}"`,
            ).not.toContain(beat);
        }
    });
});

async function bootGame(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const fixture = await testing(integrationModules());
    const client = await fixture.createClient();
    const player = await client.waitForMapChange('riverside_home', 5000);
    return { client, player };
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

function hijackUi(player: RpgPlayer): UiHarness {
    const texts: string[] = [];
    const notifications: string[] = [];
    const queuedChoices: Array<string | null> = [];
    const mutablePlayer = player as unknown as {
        showText: (message: string) => Promise<number>;
        showChoices: (
            message: string,
            choices: Array<{ text: string; value: string }>,
        ) => Promise<{ text: string; value: string } | null>;
        showNotification: (message: string) => Promise<boolean>;
    };

    mutablePlayer.showText = async (message: string) => {
        texts.push(String(message));
        return 0;
    };

    mutablePlayer.showChoices = async (
        message: string,
        choices: Array<{ text: string; value: string }>,
    ) => {
        texts.push(String(message));
        const next = queuedChoices.shift();
        if (next === undefined || next === null) return null;
        const chosen = choices.find(
            (choice) => choice.value === next || choice.text === next,
        );
        if (!chosen) {
            throw new Error(
                `Choice ${next} was not offered. Available: ${choices.map((c) => c.value).join(', ')}`,
            );
        }
        return chosen;
    };

    mutablePlayer.showNotification = async (message: string) => {
        notifications.push(String(message));
        return true;
    };

    return {
        texts,
        notifications,
        choose: (...values: Array<string | null>) => {
            queuedChoices.push(...values);
        },
    };
}
