import { describe, expect, it } from 'vitest';
import { Animation, Direction } from '@rpgjs/common';
import { PLAYER_SPRITESHEETS } from '../../src/config/player-sprites';

describe('player spritesheets', () => {
    it('define an attack fallback so action-battle and interaction taps do not reject', () => {
        for (const sheet of PLAYER_SPRITESHEETS) {
            // Layout can be `player_three_frame` (3×4) or
            // `npc_four_by_thirty_one` (4×31) — both are valid; the
            // generic `playerSheet()` factory routes each through the
            // right `standFrames` / `walkFrames` helpers. The contract
            // we keep here is that the layout is declared (non-zero)
            // and all the animation textures exist.
            expect(sheet.framesWidth).toBeGreaterThan(0);
            expect(sheet.framesHeight).toBeGreaterThan(0);
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
