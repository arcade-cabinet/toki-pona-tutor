import { describe, expect, it } from 'vitest';
import { effectSpritesheets } from '../../src/config/effect-sprites';

describe('effect spritesheets', () => {
    it('exposes idle/default textures for CanvasEngine Sprite playback', () => {
        expect(effectSpritesheets.length).toBeGreaterThan(0);

        for (const sheet of effectSpritesheets) {
            expect(sheet.animations.default).toBeDefined();
            expect(sheet.animations.idle).toBeDefined();
            expect(sheet.animations.stand).toBeDefined();
            expect(sheet.textures?.default).toBeDefined();
            expect(sheet.textures?.idle).toBeDefined();
            expect(sheet.textures?.stand).toBeDefined();
        }
    });
});
