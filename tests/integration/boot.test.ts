import { describe, it, expect, afterEach } from 'vitest';
import { testing, clear } from '@rpgjs/testing';
import server from '../../src/modules/main/server';

/**
 * Integration: the game boots.
 *
 * Drives the real @rpgjs/server + client via @rpgjs/testing in
 * standalone mode (same wiring as src/standalone.ts, with a mocked
 * LoadMap so tests don't need the vite dev server to serve tilemaps).
 * A player connects, onConnected runs, and they land on the starter
 * map at the expected spawn.
 *
 * If this test fails, nothing else works — this is the floor.
 */

afterEach(async () => {
    await clear();
});

describe('game boot', () => {
    it('spawns the player on ma_tomo_lili at (128, 128)', async () => {
        const fixture = await testing([{ server }]);
        const client = await fixture.createClient();

        // onConnected → changeMap is async; wait for onJoinMap to fire.
        const player = await client.waitForMapChange('ma_tomo_lili', 5000);

        expect(player.getCurrentMap()?.id).toBe('ma_tomo_lili');
        expect(player.x()).toBe(128);
        expect(player.y()).toBe(128);
    });
});
