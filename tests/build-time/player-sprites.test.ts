import { describe, expect, it } from 'vitest';
import { Animation, Direction } from '@rpgjs/common';
import { PLAYER_SPRITESHEETS } from '../../src/config/player-sprites';

describe('player spritesheets', () => {
    it('define an attack fallback so action-battle and interaction taps do not reject', () => {
        for (const sheet of PLAYER_SPRITESHEETS) {
            expect(sheet.framesWidth).toBe(3);
            expect(sheet.framesHeight).toBe(4);
            expect(sheet.textures.idle).toBeDefined();
            expect(sheet.textures[Animation.Attack]).toBeDefined();
        }
    });

    it('reuses the directional stand and walk strips for runtime animation playback', () => {
        const hero = PLAYER_SPRITESHEETS[0];

        expect(hero.textures.idle.animations({ direction: Direction.Right })[0]).toEqual([
            { time: 0, frameX: 1, frameY: 2 },
        ]);
        expect(hero.textures[Animation.Attack].animations({ direction: Direction.Right })[0]).toEqual([
            { time: 0, frameX: 0, frameY: 2 },
            { time: 6, frameX: 1, frameY: 2 },
            { time: 12, frameX: 2, frameY: 2 },
            { time: 18 },
        ]);
    });
});
