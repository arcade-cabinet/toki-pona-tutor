import { describe, it, expect } from 'vitest';
import { advanceQuest, isGoalMet, type QuestDef, type QuestState } from '../../src/modules/main/quest';

const catchThree: QuestDef = {
    id: 'catch_three_kon',
    giverNpcId: 'jan_pona',
    goal: { kind: 'catch_count', speciesId: 'kon_moli', target: 3 },
    reward: { xp: 50 },
};

const defeatRival: QuestDef = {
    id: 'defeat_jan_ike',
    giverNpcId: 'jan_sewi',
    goal: { kind: 'defeat_trainer', npcId: 'jan_ike' },
    reward: { xp: 80 },
};

const deliverKili: QuestDef = {
    id: 'deliver_kili',
    giverNpcId: 'jan_kala_lake',
    goal: { kind: 'deliver_item', itemId: 'kili', toNpcId: 'jan_moku' },
    reward: { xp: 40 },
};

const biomeQuest: QuestDef = {
    id: 'catch_any_lete',
    giverNpcId: 'jan_anpa',
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
            { type: 'catch', speciesId: 'kon_moli' },
        );
        expect(r.state.progress).toBe(2);
    });

    it('non-matching catch does not bump progress', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'active', progress: 1 },
            { type: 'catch', speciesId: 'jan_moli' },
        );
        expect(r.state.progress).toBe(1);
    });

    it('progress caps at target', () => {
        const r = advanceQuest(
            catchThree,
            { status: 'active', progress: 3 },
            { type: 'catch', speciesId: 'kon_moli' },
        );
        expect(r.state.progress).toBe(3);
    });

    it('ignores catches while pending', () => {
        const r = advanceQuest(catchThree, pending, { type: 'catch', speciesId: 'kon_moli' });
        expect(r.state).toEqual(pending);
    });
});

describe('advanceQuest — catch_any_in_biome progress', () => {
    it('any catch in the biome counts', () => {
        const r1 = advanceQuest(
            biomeQuest,
            { status: 'active', progress: 0 },
            { type: 'catch', speciesId: 'soweli_kiwen', biome: 'lete' },
        );
        expect(r1.state.progress).toBe(1);
        const r2 = advanceQuest(
            biomeQuest,
            r1.state,
            { type: 'catch', speciesId: 'jan_pi_sewi_pimeja', biome: 'lete' },
        );
        expect(r2.state.progress).toBe(2);
    });

    it('catches in other biomes ignored', () => {
        const r = advanceQuest(
            biomeQuest,
            { status: 'active', progress: 0 },
            { type: 'catch', speciesId: 'jan_wawa', biome: 'nena' },
        );
        expect(r.state.progress).toBe(0);
    });
});

describe('advanceQuest — defeat + deliver', () => {
    it('matching defeat sets progress to 1', () => {
        const r = advanceQuest(
            defeatRival,
            { status: 'active', progress: 0 },
            { type: 'defeat', npcId: 'jan_ike' },
        );
        expect(r.state.progress).toBe(1);
    });

    it('wrong defeat target ignored', () => {
        const r = advanceQuest(
            defeatRival,
            { status: 'active', progress: 0 },
            { type: 'defeat', npcId: 'jan_wawa' },
        );
        expect(r.state.progress).toBe(0);
    });

    it('matching deliver sets progress to 1', () => {
        const r = advanceQuest(
            deliverKili,
            { status: 'active', progress: 0 },
            { type: 'deliver', itemId: 'kili', toNpcId: 'jan_moku' },
        );
        expect(r.state.progress).toBe(1);
    });

    it('wrong deliver target ignored', () => {
        const r = advanceQuest(
            deliverKili,
            { status: 'active', progress: 0 },
            { type: 'deliver', itemId: 'kili', toNpcId: 'jan_sewi' },
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
