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
        const quest = findQuestOrThrow('quest_tomo_kili');
        await addToParty('kon_moli', 5);

        await expect(acceptQuest(quest)).resolves.toEqual({ status: 'active', progress: 0 });
        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 0 });

        await recordQuestEventForActive(player, { type: 'catch', speciesId: 'soweli_kili' });
        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 1 });

        const result = await collectQuestReward(player, quest);
        expect(result.collected).toBe(true);
        await expect(getFlag(questDoneFlag(quest.id))).resolves.toBe('1');
        await expect(getInventoryCount('kili')).resolves.toBe(2);
        expect((await getParty())[0].xp).toBe(155);
    });

    it('consumes delivery items at the target NPC before reward collection', async () => {
        const player = mockPlayer();
        const quest = findQuestOrThrow('quest_telo_kili_delivery');
        await addToInventory('kili', 1);
        await acceptQuest(quest);

        const updates = await completeDeliveryQuestsAtNpc(player, 'jan_moku');

        expect(updates).toHaveLength(1);
        await expect(getInventoryCount('kili')).resolves.toBe(0);
        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 1 });

        await collectQuestReward(player, quest);
        await expect(getInventoryCount('telo_pona')).resolves.toBe(2);
    });

    it('lists active and completed quests in the inventory journal', async () => {
        const quest = findQuestOrThrow('quest_nasin_poki_pack');
        await acceptQuest(quest);

        expect(await listQuestJournalLines()).toEqual([
            '  · pali poki: 0 / 2',
        ]);

        await recordQuestEventForActive(null, { type: 'catch', speciesId: 'soweli_jaki', biome: 'forest' });
        await recordQuestEventForActive(null, { type: 'catch', speciesId: 'soweli_kili', biome: 'forest' });

        expect(await listQuestJournalLines()).toEqual([
            '  · pali poki: 2 / 2',
        ]);
    });

    it('keeps quest offers in the in-game language layer', () => {
        const quest = findQuestOrThrow('quest_nasin_poki_pack');

        expect(formatQuestOffer(quest)).toBe('pali poki\npoki: x2');
        expect(formatQuestOffer(quest)).not.toContain('Catch');
        expect(formatQuestOffer(quest)).not.toContain('catch');
        expect(formatQuestOffer(quest)).not.toContain('forest route');
    });
});
