import { describe, it, expect } from 'vitest';
import worldRaw from '../../src/content/generated/world.json';
import {
    advanceQuest,
    isGoalMet,
    questGoalTarget,
    SIDE_QUESTS,
    type QuestDef,
    type QuestState,
} from '../../src/modules/main/quest';
import {
    formatQuestOffer,
    formatQuestProgress,
    formatQuestRewardResult,
} from '../../src/modules/main/quest-runtime';

const WORLD = worldRaw as {
    species: { id: string }[];
    items: { id: string }[];
};

const catchThree: QuestDef = {
    id: 'catch_three_kon',
    giverNpcId: 'jan_pona',
    goal: { kind: 'catch_count', speciesId: 'ashcat', target: 3 },
    reward: { xp: 50 },
};

const defeatRival: QuestDef = {
    id: 'defeat_jan_ike',
    giverNpcId: 'selby',
    goal: { kind: 'defeat_trainer', npcId: 'rook' },
    reward: { xp: 80 },
};

const deliverKili: QuestDef = {
    id: 'deliver_kili',
    giverNpcId: 'loren',
    goal: { kind: 'deliver_item', itemId: 'orchard_fruit', toNpcId: 'shopkeep' },
    reward: { xp: 40 },
};

const biomeQuest: QuestDef = {
    id: 'catch_any_lete',
    giverNpcId: 'corvin',
    goal: { kind: 'catch_any_in_biome', biome: 'lete', target: 2 },
    reward: { xp: 60 },
};

const pending: QuestState = { status: 'pending', progress: 0 };

describe('advanceQuest — accept transition', () => {
    it('pending → active on accept', () => {
        const r = advanceQuest(catchThree, pending, { type: 'accept' });
        expect(r.state).toEqual({ status: 'active', progress: 0 });
        expect(r.grantReward).toBe(false);
    });

    it('accept on already-active is idempotent', () => {
        const r = advanceQuest(catchThree, { status: 'active', progress: 1 }, { type: 'accept' });
        expect(r.state).toEqual({ status: 'active', progress: 1 });
    });

    it('accept on completed is idempotent', () => {
        const r = advanceQuest(catchThree, { status: 'completed', progress: 3 }, { type: 'accept' });
        expect(r.state).toEqual({ status: 'completed', progress: 3 });
    });
});

describe('advanceQuest — catch_count progress', () => {
    it('matching catch bumps progress by 1', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'active', progress: 1 },
            { type: 'catch', speciesId: 'ashcat' },
        );
        expect(r.state.progress).toBe(2);
    });

    it('non-matching catch does not bump progress', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'active', progress: 1 },
            { type: 'catch', speciesId: 'bog_wisp' },
        );
        expect(r.state.progress).toBe(1);
    });

    it('progress caps at target', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'active', progress: 3 },
            { type: 'catch', speciesId: 'ashcat' },
        );
        expect(r.state.progress).toBe(3);
    });

    it('ignores catches while pending', () => {
        const r = advanceQuest(catchThree, pending, { type: 'catch', speciesId: 'ashcat' });
        expect(r.state).toEqual(pending);
    });
});

describe('advanceQuest — catch_any_in_biome progress', () => {
    it('any catch in the biome counts', () => {
        const r1 = advanceQuest(
            biomeQuest,
            { status: 'active', progress: 0 },
            { type: 'catch', speciesId: 'pebbleback', biome: 'lete' },
        );
        expect(r1.state.progress).toBe(1);
        const r2 = advanceQuest(
            biomeQuest,
            r1.state,
            { type: 'catch', speciesId: 'nightspike', biome: 'lete' },
        );
        expect(r2.state.progress).toBe(2);
    });

    it('catches in other biomes ignored', () => {
        const r = advanceQuest(
            biomeQuest,
            { status: 'active', progress: 0 },
            { type: 'catch', speciesId: 'tarrin', biome: 'nena' },
        );
        expect(r.state.progress).toBe(0);
    });
});

describe('advanceQuest — defeat + deliver', () => {
    it('matching defeat sets progress to 1', () => {
        const r = advanceQuest(
            defeatRival,
            { status: 'active', progress: 0 },
            { type: 'defeat', npcId: 'rook' },
        );
        expect(r.state.progress).toBe(1);
    });

    it('wrong defeat target ignored', () => {
        const r = advanceQuest(
            defeatRival,
            { status: 'active', progress: 0 },
            { type: 'defeat', npcId: 'tarrin' },
        );
        expect(r.state.progress).toBe(0);
    });

    it('matching deliver sets progress to 1', () => {
        const r = advanceQuest(
            deliverKili,
            { status: 'active', progress: 0 },
            { type: 'deliver', itemId: 'orchard_fruit', toNpcId: 'shopkeep' },
        );
        expect(r.state.progress).toBe(1);
    });

    it('wrong deliver target ignored', () => {
        const r = advanceQuest(
            deliverKili,
            { status: 'active', progress: 0 },
            { type: 'deliver', itemId: 'orchard_fruit', toNpcId: 'selby' },
        );
        expect(r.state.progress).toBe(0);
    });
});

describe('collect_reward — end-of-quest', () => {
    it('grants reward when goal met', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'active', progress: 3 },
            { type: 'collect_reward' },
        );
        expect(r.state.status).toBe('completed');
        expect(r.grantReward).toBe(true);
    });

    it('denies reward when goal not met', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'active', progress: 1 },
            { type: 'collect_reward' },
        );
        expect(r.state.status).toBe('active');
        expect(r.grantReward).toBe(false);
    });

    it('denies re-collection on completed quest', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'completed', progress: 3 },
            { type: 'collect_reward' },
        );
        expect(r.grantReward).toBe(false);
    });
});

describe('isGoalMet', () => {
    it('catch_count compares against target', () => {
        expect(isGoalMet(catchThree, { status: 'active', progress: 2 })).toBe(false);
        expect(isGoalMet(catchThree, { status: 'active', progress: 3 })).toBe(true);
        expect(isGoalMet(catchThree, { status: 'active', progress: 10 })).toBe(true);
    });

    it('defeat/deliver are binary (progress >= 1)', () => {
        expect(isGoalMet(defeatRival, { status: 'active', progress: 0 })).toBe(false);
        expect(isGoalMet(defeatRival, { status: 'active', progress: 1 })).toBe(true);
    });
});

describe('quest runtime copy', () => {
    it('formats quest offers, progress, and reward results through gameplay JSON templates', () => {
        expect(formatQuestOffer(catchThree)).toBe('catch three kon\nCatch: Ashcat x3');
        expect(formatQuestProgress(catchThree, { status: 'active', progress: 9 })).toBe('3 / 3');
        expect(formatQuestRewardResult({
            collected: true,
            quest: deliverKili,
            state: { status: 'completed', progress: 1 },
            rewards: ['orchard_fruit x2', 'XP +40'],
        })).toBe('Quest complete: deliver kili\norchard_fruit x2\nXP +40');
        expect(formatQuestRewardResult({
            collected: false,
            quest: catchThree,
            state: { status: 'active', progress: 1 },
            reason: 'not_ready',
        })).toBe('Quest: 1 / 3');
    });
});

describe('side quest catalog', () => {
    it('ships at least two playable side quests per post-starter region', () => {
        const ids = SIDE_QUESTS.map((quest) => quest.id);
        expect(ids).toEqual([
            'quest_orchard_helper',
            'quest_greenwood_watch',
            'quest_field_notes',
            'quest_lake_delivery',
            'quest_cold_hands',
            'quest_torch_path_survey',
            'quest_last_light',
            'quest_safe_house',
            'quest_wild_signs',
            'quest_shrine_stones',
            'quest_lost_hiker',
            'quest_water_edge',
            'quest_snowbird_sighting',
            'quest_cave_shadow',
            'quest_companion_bond',
        ]);

        // story-bible requirement: >=2 side quests per region
        const byMap: Record<string, number> = {};
        for (const q of SIDE_QUESTS) {
            if (!q.mapId) continue;
            byMap[q.mapId] = (byMap[q.mapId] ?? 0) + 1;
        }
        for (const map of [
            'riverside_home',
            'greenwood_road',
            'highridge_pass',
            'lakehaven',
            'frostvale',
            'dreadpeak_cavern',
            'rivergate_approach',
        ]) {
            expect(byMap[map], `${map} quest count`).toBeGreaterThanOrEqual(2);
        }
    });

    it('uses unique ids and quest-giver ids', () => {
        expect(new Set(SIDE_QUESTS.map((quest) => quest.id)).size).toBe(SIDE_QUESTS.length);
        expect(new Set(SIDE_QUESTS.map((quest) => quest.giverNpcId)).size).toBe(SIDE_QUESTS.length);
    });

    it('references existing species and inventory rewards', () => {
        const speciesIds = new Set(WORLD.species.map((species) => species.id));
        const itemIds = new Set(WORLD.items.map((item) => item.id));

        for (const quest of SIDE_QUESTS) {
            if (quest.goal.kind === 'catch_count') {
                expect(speciesIds.has(quest.goal.speciesId), quest.id).toBe(true);
            }
            if (quest.goal.kind === 'deliver_item') {
                expect(itemIds.has(quest.goal.itemId), quest.id).toBe(true);
            }
            if (quest.reward.itemId) {
                expect(itemIds.has(quest.reward.itemId), quest.id).toBe(true);
            }
            expect(questGoalTarget(quest.goal), quest.id).toBeGreaterThan(0);
        }
    });
});
