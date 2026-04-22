import { MAXHP, type RpgPlayer } from '@rpgjs/server';
import { afterEach, describe, expect, it } from 'vitest';
import {
    addToInventory,
    addToParty,
    getInventoryCount,
    getPartyWithHealth,
} from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import { listCombatHealingChoices, useCombatHealingItem } from '../../src/modules/main/combat-items';
import { formatCombatItemChoiceLabel, formatCombatItemResult } from '../../src/modules/main/encounter';
import {
    applyWildFight,
    wildCatchChance,
    wildDamageTone,
    wildFightDamage,
    wildTargetMaxHp,
} from '../../src/modules/main/wild-combat';
import {
    formatWildCombatPrompt,
    formatWildDamagePopup,
    formatWildFightResult,
    wildDamageToneLabel,
} from '../../src/modules/main/wild-combat-ui';

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

function mockPlayer(hp: number, maxHp: number): RpgPlayer {
    return {
        hp,
        param: {
            [MAXHP]: maxHp,
        },
    } as unknown as RpgPlayer;
}

describe('combat healing items', () => {
    it('lists carried healing items with HP preview for the combat item submenu', async () => {
        await addToInventory('kili', 2);
        const player = mockPlayer(5, 44);

        await expect(listCombatHealingChoices(player)).resolves.toEqual([
            {
                id: 'kili',
                value: 'item:kili',
                label: 'kili',
                count: 2,
                healAmount: 20,
                previewHealed: 20,
            },
        ]);
    });

    it('heals the lead creature, consumes one item, and persists lead current HP', async () => {
        await addToParty('kon_moli', 5);
        await addToInventory('kili', 1);
        const player = mockPlayer(5, 44);

        await expect(useCombatHealingItem(player, 'kili')).resolves.toEqual({
            used: true,
            itemId: 'kili',
            label: 'kili',
            healed: 20,
            nextHp: 25,
            maxHp: 44,
        });

        expect((player as unknown as { hp: number }).hp).toBe(25);
        expect(await getInventoryCount('kili')).toBe(0);
        expect((await getPartyWithHealth())[0].current_hp).toBe(25);
    });

    it('does not consume an item when HP is already full', async () => {
        await addToParty('kon_moli', 5);
        await addToInventory('kili', 1);
        const player = mockPlayer(44, 44);

        await expect(useCombatHealingItem(player, 'kili')).resolves.toEqual({
            used: false,
            itemId: 'kili',
            reason: 'full',
        });
        expect(await getInventoryCount('kili')).toBe(1);
    });

    it('formats combat item submenu labels and results through gameplay JSON templates', () => {
        expect(formatCombatItemChoiceLabel({
            label: 'kili',
            count: 2,
            previewHealed: 20,
        })).toBe('kili ×2 +20 HP');
        expect(formatCombatItemChoiceLabel({
            label: 'kili',
            count: 1,
            previewHealed: 0,
        })).toBe('kili ×1 full');
        expect(formatCombatItemResult({
            used: true,
            itemId: 'kili',
            label: 'kili',
            healed: 20,
            nextHp: 25,
            maxHp: 44,
        })).toBe('kili: +20 HP\nHP 25 / 44');
        expect(formatCombatItemResult({
            used: false,
            itemId: 'kili',
            reason: 'full',
        })).toBe('sijelo li pona');
    });
});

describe('wild encounter combat helpers', () => {
    it('scales target HP from species base HP plus encounter level', () => {
        expect(wildTargetMaxHp(42, 3)).toBe(48);
        expect(wildTargetMaxHp(undefined, 0)).toBe(3);
    });

    it('fight damage is deterministic and cannot reduce the target below 1 HP', () => {
        const damage = wildFightDamage({
            attackerLevel: 5,
            attackerAttack: 52,
            defenderDefense: 32,
        });

        expect(damage).toBeGreaterThan(1);
        expect(applyWildFight({ targetHp: 10, targetMaxHp: 48 }, damage)).toEqual({
            state: {
                targetHp: 1,
                targetMaxHp: 48,
            },
            damage: 9,
        });
    });

    it('scales fight damage by type matchup and labels the tone', () => {
        expect(wildFightDamage({
            attackerLevel: 4,
            attackerAttack: 40,
            defenderDefense: 40,
            typeMultiplier: 2,
        })).toBe(40);
        expect(wildFightDamage({
            attackerLevel: 4,
            attackerAttack: 40,
            defenderDefense: 40,
            typeMultiplier: 0.5,
        })).toBe(10);

        expect(wildDamageTone(2)).toBe('super');
        expect(wildDamageTone(0.5)).toBe('resisted');
        expect(wildDamageTone(0)).toBe('miss');
        expect(wildDamageToneLabel('super')).toBe('pona mute');
        expect(wildDamageToneLabel('resisted')).toBe('awen');
        expect(formatWildDamagePopup(40, 2)).toBe('-40 HP · pona mute');
        expect(formatWildDamagePopup(0, 0)).toBe('pakala');
    });

    it('keeps full-HP catch chance at zero and raises it after a fight', () => {
        expect(wildCatchChance({
            targetHp: 48,
            targetMaxHp: 48,
            catchRate: 0.45,
            pokiPower: 1,
        })).toBe(0);
        expect(wildCatchChance({
            targetHp: 20,
            targetMaxHp: 48,
            catchRate: 0.45,
            pokiPower: 1,
        })).toBeGreaterThan(0.25);
    });

    it('formats the wild combat prompt with target, level, HP, and HP tier', () => {
        expect(formatWildCombatPrompt(
            { id: 'jan_ike_lili', name: { en: 'jan ike lili' } },
            3,
            { targetHp: 20, targetMaxHp: 48 },
        )).toBe('jan ike lili L3\nHP 20 / 48 · pakala');
        expect(formatWildFightResult(9, { targetHp: 1, targetMaxHp: 48 }))
            .toBe('utala: -9 HP · pona\nsoweli HP 1 / 48 · moli');
        expect(formatWildFightResult(18, { targetHp: 2, targetMaxHp: 48 }, 2))
            .toBe('utala: -18 HP · pona mute\nsoweli HP 2 / 48 · moli');
    });
});
