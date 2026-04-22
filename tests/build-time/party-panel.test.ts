import { afterEach, describe, expect, it } from 'vitest';
import { applyHeal, healingItem } from '../../src/modules/main/healing-items';
import { buildPartyPanelSlot } from '../../src/modules/main/party-panel';
import { promoteToLead } from '../../src/modules/main/party-order';
import {
    addToInventory,
    addToParty,
    consumeInventoryItem,
    getInventoryCount,
    getParty,
    getPartyWithHealth,
    setPartyCurrentHp,
    setInventoryCount,
    setPartyOrder,
} from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

describe('buildPartyPanelSlot', () => {
    it('formats portrait, HP, type, XP, and known moves for the pause party panel', () => {
        const slot = buildPartyPanelSlot(
            {
                slot: 0,
                species_id: 'kon_moli',
                level: 5,
                xp: 0,
            },
            {
                selectedSlot: 0,
                leadHp: {
                    currentHp: 24,
                    maxHp: 48,
                },
            },
        );

        expect(slot.primaryLabel).toBe('kon moli');
        expect(slot.secondaryLabel).toBe('kon');
        expect(slot.portraitSrc).toBe('/assets/creatures/wraith/wraith.png');
        expect(slot.typeLabel).toBe('seli');
        expect(slot.levelLabel).toBe('L5');
        expect(slot.hpLabel).toBe('HP 24 / 48');
        expect(slot.currentHp).toBe(24);
        expect(slot.maxHp).toBe(48);
        expect(slot.hpPercent).toBe(50);
        expect(slot.hpClass).toBe('hp-wounded');
        expect(slot.xpLabel).toBe('XP 125 / 216');
        expect(slot.nextXpLabel).toBe('91 to L6');
        expect(slot.moveSummary).toBe('ember · attack');
        expect(slot.selected).toBe(true);
        expect(slot.isLead).toBe(true);
    });

    it('falls back cleanly for unknown species metadata', () => {
        const slot = buildPartyPanelSlot({
            slot: 2,
            species_id: 'mystery_beast',
            level: 1,
            xp: 0,
        });

        expect(slot.primaryLabel).toBe('mystery beast');
        expect(slot.secondaryLabel).toBeNull();
        expect(slot.typeLabel).toBe('unknown');
        expect(slot.portraitSrc).toBeNull();
        expect(slot.portraitFallback).toBe('MB');
        expect(slot.hpLabel).toBe('HP 1 / 1');
        expect(slot.moveSummary).toBe('moves: ala');
    });
});

describe('kili healing item', () => {
    it('resolves heal amount from generated world content and clamps at max HP', () => {
        expect(healingItem('kili')).toEqual({
            id: 'kili',
            label: 'kili',
            amount: 20,
        });
        expect(applyHeal({ currentHp: 9, maxHp: 44 }, 20)).toEqual({
            currentHp: 9,
            maxHp: 44,
            nextHp: 29,
            healed: 20,
        });
        expect(applyHeal({ currentHp: 40, maxHp: 44 }, 20)).toEqual({
            currentHp: 40,
            maxHp: 44,
            nextHp: 44,
            healed: 4,
        });
        expect(applyHeal({ currentHp: 44, maxHp: 44 }, 20).healed).toBe(0);
    });
});

describe('setPartyOrder', () => {
    it('persists promote-to-lead order without losing roster data', async () => {
        await addToParty('kon_moli', 5);
        await addToParty('jan_ike_lili', 3);

        const before = await getParty();
        await setPartyOrder(promoteToLead(before, 1));

        expect(await getParty()).toEqual([
            {
                slot: 0,
                species_id: 'jan_ike_lili',
                level: 3,
                xp: 0,
            },
            {
                slot: 1,
                species_id: 'kon_moli',
                level: 5,
                xp: 0,
            },
        ]);
    });

    it('keeps persisted HP attached to the creature when reordering slots', async () => {
        await addToParty('kon_moli', 5);
        await addToParty('jan_ike_lili', 3);
        await setPartyCurrentHp(0, 11);
        await setPartyCurrentHp(1, 7);

        await setPartyOrder(promoteToLead(await getParty(), 1));

        expect(await getPartyWithHealth()).toEqual([
            expect.objectContaining({
                slot: 0,
                species_id: 'jan_ike_lili',
                current_hp: 7,
            }),
            expect.objectContaining({
                slot: 1,
                species_id: 'kon_moli',
                current_hp: 11,
            }),
        ]);
    });

    it('rejects duplicate or partial slot lists', async () => {
        await addToParty('kon_moli', 5);
        await addToParty('jan_ike_lili', 3);

        await expect(setPartyOrder([{ slot: 0 }])).rejects.toThrow(/every current slot/);
        await expect(setPartyOrder([{ slot: 0 }, { slot: 0 }])).rejects.toThrow(/unknown or duplicate/);
    });
});

describe('party health and inventory persistence', () => {
    it('tracks current HP separately from the stable getParty shape', async () => {
        await addToParty('kon_moli', 5);

        expect(await getParty()).toEqual([
            {
                slot: 0,
                species_id: 'kon_moli',
                level: 5,
                xp: 0,
            },
        ]);
        expect((await getPartyWithHealth())[0]).toEqual({
            slot: 0,
            species_id: 'kon_moli',
            level: 5,
            xp: 0,
            current_hp: null,
        });

        await expect(setPartyCurrentHp(0, 13)).resolves.toBe(true);
        expect((await getPartyWithHealth())[0].current_hp).toBe(13);
    });

    it('decrements stackable healing inventory without underflowing', async () => {
        await addToInventory('kili', 2);

        await expect(consumeInventoryItem('kili')).resolves.toBe(true);
        expect(await getInventoryCount('kili')).toBe(1);
        await expect(consumeInventoryItem('kili', 2)).resolves.toBe(false);
        expect(await getInventoryCount('kili')).toBe(1);
        await expect(consumeInventoryItem('kili')).resolves.toBe(true);
        expect(await getInventoryCount('kili')).toBe(0);
        await setInventoryCount('kili', 3);
        expect(await getInventoryCount('kili')).toBe(3);
        await setInventoryCount('kili', 0);
        expect(await getInventoryCount('kili')).toBe(0);
    });
});
