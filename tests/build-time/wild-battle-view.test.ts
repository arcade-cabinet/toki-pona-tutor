import { describe, expect, it } from 'vitest';
import worldRaw from '../../src/content/generated/world.json';
import {
    buildWildBattleCapture,
    buildWildBattleDamage,
    buildWildBattleView,
    wildBattleSpriteFrame,
} from '../../src/modules/main/wild-battle-view';

type Species = {
    id: string;
    name?: { en?: string; tp?: string };
    type?: string;
    base_stats?: { hp?: number };
    sprite?: {
        src?: string;
        animations?: Record<string, {
            src?: string;
            row: number;
            col_start: number;
            cols: number;
            fps: number;
        }>;
    };
};

const world = worldRaw as unknown as { species: Species[] };
const species = new Map(world.species.map((entry) => [entry.id, entry]));

describe('wild battle view model', () => {
    it('builds a lead-vs-target overlay model with HP tiers and species sprite frames', () => {
        const leadSpecies = species.get('kon_moli')!;
        const target = species.get('jan_ike_lili')!;

        const view = buildWildBattleView({
            lead: {
                slot: 0,
                species_id: 'kon_moli',
                level: 5,
                current_hp: 34,
            },
            leadSpecies,
            target,
            targetLevel: 3,
            targetCombat: {
                targetHp: 20,
                targetMaxHp: 48,
            },
        });

        expect(view.lead).toMatchObject({
            id: 'kon_moli',
            label: 'kon moli',
            levelLabel: 'L5',
            hpLabel: 'HP 34 / 44',
            hpClass: 'hp-healthy',
        });
        expect(view.target).toMatchObject({
            id: 'jan_ike_lili',
            label: 'jan ike lili',
            levelLabel: 'L3',
            hpLabel: 'HP 20 / 48',
            hpClass: 'hp-wounded',
        });
        expect(view.lead?.sprite?.src).toBe('/assets/creatures/wraith/wraith.png');
        expect(view.target.sprite?.src).toBe('/assets/creatures/goblin/goblin.png');
    });

    it('crops the first idle frame from the species sheet without requiring a portrait-only asset', () => {
        expect(wildBattleSpriteFrame(species.get('kon_moli'))).toMatchObject({
            src: '/assets/creatures/wraith/wraith.png',
            frameX: 0,
            frameY: 0,
            framesWidth: 4,
            framesHeight: 7,
        });
    });

    it('keeps damage popups sprite-local and tone-specific', () => {
        expect(buildWildBattleDamage(18, 2)).toEqual({
            label: '-18 HP',
            damage: 18,
            tone: 'super',
        });
        expect(buildWildBattleDamage(0, 0)).toEqual({
            label: 'pakala',
            damage: 0,
            tone: 'miss',
        });
    });

    it('models catch throw and result states for the wild overlay', () => {
        expect(buildWildBattleCapture('throw')).toEqual({
            state: 'throw',
            label: 'poki li tawa',
        });
        expect(buildWildBattleCapture('caught')).toEqual({
            state: 'caught',
            label: 'poki li awen',
        });
        expect(buildWildBattleCapture('escaped')).toEqual({
            state: 'escaped',
            label: 'soweli li weka',
        });

        const target = species.get('jan_ike_lili')!;
        expect(buildWildBattleView({
            target,
            targetLevel: 3,
            targetCombat: {
                targetHp: 20,
                targetMaxHp: 48,
            },
            capture: 'caught',
        }).capture).toEqual({
            state: 'caught',
            label: 'poki li awen',
        });
    });
});
