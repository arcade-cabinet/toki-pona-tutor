import { describe, it, expect, afterEach } from 'vitest';
import { testing, clear } from '@rpgjs/testing';
import { Container, h } from 'canvasengine';
import server from '../../src/modules/main/server';
import { COMBAT_FAINT_ANIMATION_ID } from '../../src/modules/main/combat-visuals';
import { WILD_BATTLE_GUI_ID } from '../../src/modules/main/wild-battle-view';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';

/**
 * Integration floor: the engine boots and the player lands on the
 * starter map. If this test fails, nothing else in the integration
 * or E2E suite can work. Integration tests run in-process via
 * @rpgjs/testing — fast feedback on module wiring + server/client
 * contracts. Real-browser, real-Capacitor, real-canvas checks live
 * in tests/e2e/.
 */

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
    await clear();
});

describe('game boot (integration)', () => {
    it('spawns the player on ma_tomo_lili at (128, 128)', async () => {
        const fixture = await testing(integrationModules());
        const client = await fixture.createClient();

        const player = await client.waitForMapChange('ma_tomo_lili', 5000);

        expect(player.getCurrentMap()?.id).toBe('ma_tomo_lili');
        expect(player.x()).toBe(128);
        expect(player.y()).toBe(128);
    });
});

function integrationModules() {
    return [{
        server,
        client: {
            gui: [{
                id: WILD_BATTLE_GUI_ID,
                component: () => h(Container, {}),
            }],
            componentAnimations: [{
                id: COMBAT_FAINT_ANIMATION_ID,
                component: () => h(Container, {}),
            }],
        },
    }];
}
