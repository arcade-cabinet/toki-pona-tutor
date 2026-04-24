import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATK, MAXSP, PDEF, type RpgPlayer } from '@rpgjs/server';
import {
    buildActionBattleSkill,
    buildLeadMoveBarModel,
    LEAD_ACTION_BATTLE_SKILL_DATABASE,
    LEAD_MOVE_BAR_GUI_ID,
    moveSkillId,
    openLeadMoveBar,
    syncLeadBattleSkills,
    useLeadBattleMove,
    type LeadActionBattleSkill,
} from '../../src/modules/main/lead-battle-skills';
import { addToParty } from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import worldRaw from '../../src/content/generated/world.json';

type TestPlayer = RpgPlayer & {
    sp: number;
    param: Record<string | number, number>;
    skills: () => Array<{ id: string }>;
    learnSkill: ReturnType<typeof vi.fn>;
    forgetSkill: ReturnType<typeof vi.fn>;
    useSkill: ReturnType<typeof vi.fn>;
    setGraphicAnimation: ReturnType<typeof vi.fn>;
    gui: ReturnType<typeof vi.fn>;
    getGui: ReturnType<typeof vi.fn>;
    battleEvents: Array<{ applyDamage: ReturnType<typeof vi.fn> }>;
};

const world = worldRaw as unknown as {
    moves: Array<{ id: string }>;
    species: Array<{ id: string; name?: { en?: string; tp?: string }; learnset: Array<{ level: number; move_id: string }> }>;
};

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

describe('lead battle skills', () => {
    it('projects authored move data into RPG.js action-battle skills', () => {
        const move = world.moves.find((entry) => entry.id === 'ember_nip');

        const skill = buildActionBattleSkill(move as never);

        expect(skill).toMatchObject({
            _type: 'skill',
            id: moveSkillId('ember_nip'),
            name: 'ember',
            description: 'Fire burns.',
            spCost: 2,
            power: 13,
            hitRate: 1,
        });
        expect(skill.coefficient).toEqual({
            [ATK]: 0.65,
            [PDEF]: 1,
        });
    });

    it('keeps the registered action-battle skill database sync-safe', () => {
        const allowedKeys = ['_type', 'coefficient', 'description', 'hitRate', 'id', 'name', 'power', 'spCost'];

        for (const skill of Object.values(LEAD_ACTION_BATTLE_SKILL_DATABASE)) {
            expect(Object.keys(skill).sort()).toEqual(allowedKeys);
            expect(JSON.parse(JSON.stringify(skill))).toEqual(skill);
        }
    });

    it('builds a four-slot move bar model from the lead species learnset', () => {
        const species = world.species.find((entry) => entry.id === 'ashcat');

        const model = buildLeadMoveBarModel(
            { speciesId: 'ashcat', level: 20 },
            species as never,
            new Map([[moveSkillId('flame_strike'), 10_500]]),
            10_000,
        );

        expect(model.leadLabel).toBe('Ashcat');
        expect(model.levelLabel).toBe('L20');
        expect(model.energyLabel).toBe('36 SP');
        expect(model.target).toEqual({
            label: 'target',
            statusLabel: 'move close, then tap a move',
            inRange: false,
            distanceTiles: null,
        });
        expect(model.moves.map((move) => move.moveId)).toEqual([
            'ember_nip',
            'quick_jab',
            'flame_strike',
            'gust_strike',
        ]);
        expect(model.moves.find((move) => move.moveId === 'flame_strike')).toMatchObject({
            actionId: moveSkillId('flame_strike'),
            disabled: true,
            readyAt: 10_500,
            spCost: 5,
            rangeTiles: 3,
            meta: 'fire · power 75 · 5 SP',
        });
        expect(model.moves.find((move) => move.moveId === 'quick_jab')).toMatchObject({
            typeLabel: 'stone',
            rangeTiles: 1,
            disabled: false,
        });
    });

    it('syncs player SP and movebar data without mutating RPG.js learned skills', async () => {
        const player = mockPlayer();
        player.knownSkills = [
            { id: moveSkillId('ember_nip') },
            { id: `${moveSkillId('old_move')}` },
            { id: 'unrelated_skill' },
        ];

        const model = await syncLeadBattleSkills(player, { speciesId: 'ashcat', level: 5 });

        expect(model?.moves.map((move) => move.moveId)).toEqual(['ember_nip', 'quick_jab']);
        expect(model?.target).toEqual({
            label: 'jan ike',
            statusLabel: 'in range · 2 tiles',
            inRange: true,
            distanceTiles: 2,
        });
        expect(player.param[MAXSP]).toBe(12);
        expect(player.sp).toBe(12);
        expect(player.forgetSkill).not.toHaveBeenCalled();
        expect(player.learnSkill).not.toHaveBeenCalled();
    });

    it('opens the lead move bar and executes the selected move against the nearest battle AI event', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(20_000);
        const player = mockPlayer();
        const gui = player.gui(LEAD_MOVE_BAR_GUI_ID);

        await openLeadMoveBar(player, { speciesId: 'ashcat', level: 5 });
        const used = await useLeadBattleMove(player, moveSkillId('ember_nip'));

        expect(gui.open).toHaveBeenCalledWith(expect.objectContaining({
            speciesId: 'ashcat',
            target: expect.objectContaining({
                label: 'jan ike',
                inRange: true,
            }),
            moves: expect.arrayContaining([
                expect.objectContaining({ moveId: 'ember_nip' }),
            ]),
        }));
        expect(used).toBe(true);
        expect(player.setGraphicAnimation).toHaveBeenCalledWith('attack', 1);
        expect(player.sp).toBe(10);
        expect(player.useSkill).not.toHaveBeenCalled();
        expect(player.battleEvents[0]?.applyDamage).toHaveBeenCalledWith(
            player,
            expect.objectContaining({ id: moveSkillId('ember_nip') }),
        );
        expect(gui.update).toHaveBeenCalledWith(expect.objectContaining({
            moves: expect.arrayContaining([
                expect.objectContaining({
                    actionId: moveSkillId('ember_nip'),
                    disabled: true,
                    readyAt: 21_400,
                }),
            ]),
        }));
        vi.useRealTimers();
    });

    it('uses the persisted lead party slot when executing after a switch remount', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(30_000);
        await addToParty('applepup', 4);
        const player = mockPlayer();
        const gui = player.gui(LEAD_MOVE_BAR_GUI_ID);

        await openLeadMoveBar(player, { speciesId: 'ashcat', level: 5 });
        const used = await useLeadBattleMove(player, moveSkillId('leaf_jab'));

        expect(used).toBe(true);
        expect(player.battleEvents[0]?.applyDamage).toHaveBeenCalledWith(
            player,
            expect.objectContaining({ id: moveSkillId('leaf_jab') }),
        );
        expect(gui.update).toHaveBeenCalledWith(expect.objectContaining({
            speciesId: 'applepup',
            moves: expect.arrayContaining([
                expect.objectContaining({
                    actionId: moveSkillId('leaf_jab'),
                    disabled: true,
                    readyAt: 31_400,
                }),
            ]),
        }));
        vi.useRealTimers();
    });
});

function mockPlayer(): TestPlayer & { knownSkills: Array<{ id: string }> } {
    const gui = {
        open: vi.fn(),
        update: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
    };
    const battleEvents = [
        { id: 'jan-ike', battleAi: true, hp: 20, x: () => 96, y: () => 0, applyDamage: vi.fn() },
        { id: 'jan-suli', battleAi: true, hp: 20, x: () => 240, y: () => 0, applyDamage: vi.fn() },
    ];
    const player = {
        hp: 12,
        sp: 0,
        param: {},
        knownSkills: [],
        x: () => 0,
        y: () => 0,
        skills() {
            return this.knownSkills;
        },
        learnSkill: vi.fn(function(this: { knownSkills: Array<{ id: string }> }, skill: LeadActionBattleSkill | string) {
            const id = typeof skill === 'string' ? skill : skill.id;
            this.knownSkills.push({ id });
            return skill;
        }),
        forgetSkill: vi.fn(function(this: { knownSkills: Array<{ id: string }> }, skillId: string) {
            this.knownSkills = this.knownSkills.filter((skill) => skill.id !== skillId);
            return { id: skillId };
        }),
        useSkill: vi.fn(),
        setGraphicAnimation: vi.fn(),
        getCurrentMap: () => ({
            getEvents: () => battleEvents,
        }),
        gui: vi.fn(() => gui),
        getGui: vi.fn(() => gui),
        battleEvents,
    };
    return player as unknown as TestPlayer & { knownSkills: Array<{ id: string }> };
}
