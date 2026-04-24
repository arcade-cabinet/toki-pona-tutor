import { describe, expect, it } from 'vitest';
import { Animation, Direction } from '@rpgjs/common';
import worldRaw from '../../src/content/generated/world.json';
import {
    CREATURE_SPRITESHEETS,
    creatureSpriteId,
    type CreatureSpritesheetEntry,
} from '../../src/config/creature-sprites';
import { wildCombatFace } from '../../src/modules/main/wild-combat-ui';

type SpeciesEntry = {
    id: string;
    sprite?: {
        src: string;
        animations: Record<string, unknown>;
    };
};

const world = worldRaw as unknown as { species: SpeciesEntry[] };

describe('creature spritesheets', () => {
    it('registers every curated species sprite for battle avatars and wild-combat faces', () => {
        const curated = world.species.filter((species) => species.sprite?.animations);
        const registered = new Map(CREATURE_SPRITESHEETS.map((sheet) => [sheet.id, sheet]));

        expect(CREATURE_SPRITESHEETS).toHaveLength(curated.length);
        for (const species of curated) {
            expect(registered.get(creatureSpriteId(species.id))).toMatchObject({
                id: creatureSpriteId(species.id),
                image: species.sprite!.src.replace(/^\//, ''),
            });
        }
    });

    it('builds idle/default animations from the species frame grid', () => {
        const konMoli = CREATURE_SPRITESHEETS.find(
            (sheet): sheet is CreatureSpritesheetEntry => sheet.id === creatureSpriteId('ashcat'),
        );
        expect(konMoli).toMatchObject({
            framesWidth: 4,
            framesHeight: 7,
            animations: {
                default: { frames: [0, 1, 2, 3], duration: 1000 },
                idle: { frames: [0, 1, 2, 3], duration: 1000 },
                stand: { frames: [0, 1, 2, 3], duration: 1000 },
                attack: { frames: [16, 17, 18, 19], duration: 400 },
            },
        });
        expect(konMoli?.textures.default.animations()[0]).toEqual([
            { time: 0, frameX: 0, frameY: 0 },
            { time: 250, frameX: 1, frameY: 0 },
            { time: 500, frameX: 2, frameY: 0 },
            { time: 750, frameX: 3, frameY: 0 },
            { time: 1000 },
        ]);
        expect(konMoli?.textures.idle.animations()[0]).toEqual(konMoli?.textures.default.animations()[0]);
        expect(konMoli?.textures.stand.animations()[0]).toEqual(konMoli?.textures.default.animations()[0]);
        expect(konMoli?.textures[Animation.Attack].animations()[0]).toEqual([
            { time: 0, frameX: 0, frameY: 4 },
            { time: 100, frameX: 1, frameY: 4 },
            { time: 200, frameX: 2, frameY: 4 },
            { time: 300, frameX: 3, frameY: 4 },
            { time: 400 },
        ]);
    });

    it('falls back to directional or walk strips when a species has no literal idle row', () => {
        const cat = CREATURE_SPRITESHEETS.find(
            (sheet): sheet is CreatureSpritesheetEntry => sheet.id === creatureSpriteId('mirthcat'),
        );
        const crab = CREATURE_SPRITESHEETS.find(
            (sheet): sheet is CreatureSpritesheetEntry => sheet.id === creatureSpriteId('snapper'),
        );

        expect(cat?.textures[Animation.Stand].animations({ direction: Direction.Left })[0][0]).toEqual({
            time: 0,
            frameX: 0,
            frameY: 1,
        });
        expect(cat?.textures[Animation.Walk].animations({ direction: Direction.Right })[0][0]).toEqual({
            time: 0,
            frameX: 0,
            frameY: 7,
        });
        expect(crab?.textures.default.animations()[0][0]).toMatchObject({
            frameX: 0,
            frameY: 0,
        });
    });

    it('returns an idle face for any species with registered sprite metadata', () => {
        expect(wildCombatFace({
            id: 'ashcat',
            sprite: { animations: { idle: {} } },
        })).toEqual({
            id: 'species_ashcat',
            expression: 'idle',
        });
        expect(wildCombatFace({
            id: 'mirthcat',
            sprite: { animations: { idle_down: {} } },
        })).toEqual({
            id: 'species_mirthcat',
            expression: 'idle',
        });
        expect(wildCombatFace({ id: 'legacy_only' })).toBeUndefined();
    });
});
