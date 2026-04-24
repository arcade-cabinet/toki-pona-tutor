import type { RpgPlayer } from '@rpgjs/server';
import { afterEach, describe, expect, it } from 'vitest';
import {
    addToInventory,
    addToParty,
    getFlag,
    getInventoryCount,
    getParty,
} from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import {
    acceptQuest,
    collectQuestReward,
    completeDeliveryQuestsAtNpc,
    findQuestOrThrow,
    formatQuestOffer,
    listQuestJournalLines,
    questDoneFlag,
    readQuestState,
    recordQuestEventForActive,
} from '../../src/modules/main/quest-runtime';

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

function mockPlayer(): RpgPlayer {
    return {
        showText: async () => undefined,
        showNotification: async () => undefined,
    } as unknown as RpgPlayer;
}

describe('quest runtime', () => {
    it('accepts, advances, rewards, and persists a catch-count quest', async () => {
        const player = mockPlayer();
        const quest = findQuestOrThrow('quest_orchard_helper');
        await addToParty('ashcat', 5);

        await expect(acceptQuest(quest)).resolves.toEqual({ status: 'active', progress: 0 });
        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 0 });

        await recordQuestEventForActive(player, { type: 'catch', speciesId: 'applepup' });
        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 1 });

        const result = await collectQuestReward(player, quest);
        expect(result.collected).toBe(true);
        await expect(getFlag(questDoneFlag(quest.id))).resolves.toBe('1');
        await expect(getInventoryCount('orchard_fruit')).resolves.toBe(2);
        expect((await getParty())[0].xp).toBe(155);
    });

    it('consumes delivery items at the target NPC before reward collection', async () => {
        const player = mockPlayer();
        const quest = findQuestOrThrow('quest_lake_delivery');
        await addToInventory('orchard_fruit', 1);
        await acceptQuest(quest);

        const updates = await completeDeliveryQuestsAtNpc(player, 'shopkeep');

        expect(updates).toHaveLength(1);
        await expect(getInventoryCount('orchard_fruit')).resolves.toBe(0);
        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 1 });

        await collectQuestReward(player, quest);
        await expect(getInventoryCount('spring_tonic')).resolves.toBe(2);
    });

    it('lists active and completed quests in the inventory journal', async () => {
        const quest = findQuestOrThrow('quest_field_notes');
        await acceptQuest(quest);

        expect(await listQuestJournalLines()).toEqual([
            '  · Field Notes: 0 / 2',
        ]);

        await recordQuestEventForActive(null, { type: 'catch', speciesId: 'mudgrub', biome: 'forest' });
        await recordQuestEventForActive(null, { type: 'catch', speciesId: 'applepup', biome: 'forest' });

        expect(await listQuestJournalLines()).toEqual([
            '  · Field Notes: 2 / 2',
        ]);
    });

    it('keeps quest offers in the English in-game layer', () => {
        const quest = findQuestOrThrow('quest_field_notes');

        expect(formatQuestOffer(quest)).toBe('Field Notes\nCatch: x2');
        expect(formatQuestOffer(quest)).not.toContain('forest route');
    });
});
