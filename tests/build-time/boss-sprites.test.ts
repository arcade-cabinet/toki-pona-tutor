import { describe, expect, it } from 'vitest';
import { bossSpritesheets } from '../../src/config/boss-sprites';

describe('boss spritesheets', () => {
    it('registers the green dragon idle and death strips from gameplay JSON', () => {
        expect(bossSpritesheets.map((sheet) => sheet.id)).toEqual([
            'green_dragon_idle',
            'green_dragon_death',
        ]);

        const idle = bossSpritesheets[0];
        const death = bossSpritesheets[1];
        expect(idle?.textures.idle.animations[0]).toHaveLength(32);
        expect(idle?.textures.default.animations[0]?.at(-1)).toEqual({ time: 1457, frameX: 31, frameY: 0 });
        expect(death?.textures.death.animations[0]).toHaveLength(9);
        expect(death?.textures.death.animations[0]?.at(-1)).toEqual({ time: 1064, frameX: 8, frameY: 0 });
    });
});
