import { describe, expect, it } from 'vitest';
import { playClientSfx, type ClientSoundEngine } from '../../src/config/client-sfx';

describe('playClientSfx', () => {
    it('plays client-side SFX through the configured bus volume', async () => {
        const calls: Array<{ id: string; volume?: number; loop?: boolean }> = [];
        const engine: ClientSoundEngine = {
            playSound(id, options) {
                calls.push({ id, ...options });
            },
        };

        await playClientSfx(engine, 'sfx_menu_confirm', () => 50);

        expect(calls).toEqual([
            {
                id: 'sfx_menu_confirm',
                volume: 0.3,
                loop: false,
            },
        ]);
    });

    it('does not throw when the browser audio backend rejects', async () => {
        const engine: ClientSoundEngine = {
            async playSound() {
                throw new Error('audio locked');
            },
        };

        await expect(playClientSfx(engine, 'sfx_menu_tick', () => 100)).resolves.toBeUndefined();
    });
});
