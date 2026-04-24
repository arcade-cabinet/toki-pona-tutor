import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATK, MAXHP, MAXSP, PDEF, type RpgPlayer } from '@rpgjs/server';
import { addToParty, getPartyWithHealth, setPartyCurrentHp } from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import {
    activateLeadBattleAvatar,
    buildLeadBattleAvatarModel,
    isLeadBattleAvatarActive,
    restoreLeadBattleAvatar,
    switchLeadBattleAvatarToPartySlot,
    switchToNextAvailableLeadBattleAvatar,
    syncLeadCreatureStats,
} from '../../src/modules/main/lead-battle-avatar';
import { LEAD_MOVE_BAR_GUI_ID, type LeadActionBattleSkill } from '../../src/modules/main/lead-battle-skills';

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

describe('lead battle avatar', () => {
    it('derives action-battle graphic and scaled stats from the lead creature', () => {
        const model = buildLeadBattleAvatarModel(
            { slot: 0, species_id: 'ashcat', level: 5, current_hp: null },
            {
                id: 'ashcat',
                base_stats: { hp: 44, attack: 52, defense: 34 },
                sprite: {},
            },
        );

        expect(model).toEqual({
            speciesId: 'ashcat',
            graphic: 'species_ashcat',
            level: 5,
            currentHp: 54,
            maxHp: 54,
            attack: 16,
            defense: 8,
        });
    });

    it('syncs the server player stats and swaps the battle body to the lead species', async () => {
        await addToParty('ashcat', 5);
        await setPartyCurrentHp(0, 31);
        const player = mockPlayer('hero');

        const model = await activateLeadBattleAvatar(player);

        expect(model?.graphic).toBe('species_ashcat');
        expect(player.setGraphic).toHaveBeenCalledWith('species_ashcat');
        expect(player.param[MAXHP]).toBe(54);
        expect(player.param[ATK]).toBe(16);
        expect(player.param[PDEF]).toBe(8);
        expect(player.param[MAXSP]).toBe(12);
        expect(player.sp).toBe(12);
        expect(player.learnSkill).not.toHaveBeenCalled();
        expect(player.gui(LEAD_MOVE_BAR_GUI_ID).open).toHaveBeenCalledWith(expect.objectContaining({
            speciesId: 'ashcat',
            moves: expect.arrayContaining([
                expect.objectContaining({ moveId: 'ember_nip' }),
                expect.objectContaining({ moveId: 'quick_jab' }),
            ]),
        }));
        expect(player.hp).toBe(31);
        expect(isLeadBattleAvatarActive(player)).toBe(true);
    });

    it('restores the field graphic and persists the latest lead HP', async () => {
        await addToParty('ashcat', 5);
        const player = mockPlayer('hero');

        await activateLeadBattleAvatar(player);
        player.hp = 17;
        await restoreLeadBattleAvatar(player);

        expect(player.setGraphic).toHaveBeenLastCalledWith('hero');
        expect(player.gui(LEAD_MOVE_BAR_GUI_ID).close).toHaveBeenCalled();
        expect(isLeadBattleAvatarActive(player)).toBe(false);
        expect((await getPartyWithHealth())[0].current_hp).toBe(17);
    });

    it('promotes the next conscious party creature when the battle lead faints', async () => {
        await addToParty('ashcat', 5);
        await addToParty('applepup', 4);
        await setPartyCurrentHp(0, 1);
        await setPartyCurrentHp(1, 9);
        const player = mockPlayer('hero');

        await activateLeadBattleAvatar(player);
        player.hp = 0;
        const next = await switchToNextAvailableLeadBattleAvatar(player);

        expect(next?.speciesId).toBe('applepup');
        expect(next?.currentHp).toBe(9);
        expect(player.setGraphic).toHaveBeenLastCalledWith('species_applepup');
        expect(player.gui(LEAD_MOVE_BAR_GUI_ID).open).toHaveBeenLastCalledWith(expect.objectContaining({
            speciesId: 'applepup',
        }));
        expect(isLeadBattleAvatarActive(player)).toBe(true);
        expect(await getPartyWithHealth()).toMatchObject([
            { slot: 0, species_id: 'applepup', current_hp: 9 },
            { slot: 1, species_id: 'ashcat', current_hp: 0 },
        ]);

        await restoreLeadBattleAvatar(player);
        expect(player.setGraphic).toHaveBeenLastCalledWith('hero');
    });

    it('switches to a selected conscious bench creature during active battle', async () => {
        await addToParty('ashcat', 5);
        await addToParty('applepup', 4);
        await setPartyCurrentHp(0, 21);
        await setPartyCurrentHp(1, 11);
        const player = mockPlayer('hero');

        await activateLeadBattleAvatar(player);
        player.hp = 19;
        const switched = await switchLeadBattleAvatarToPartySlot(player, 1);

        expect(switched?.speciesId).toBe('applepup');
        expect(switched?.currentHp).toBe(11);
        expect(player.setGraphic).toHaveBeenLastCalledWith('species_applepup');
        expect(player.gui(LEAD_MOVE_BAR_GUI_ID).open).toHaveBeenLastCalledWith(expect.objectContaining({
            speciesId: 'applepup',
        }));
        expect(await getPartyWithHealth()).toMatchObject([
            { slot: 0, species_id: 'applepup', current_hp: 11 },
            { slot: 1, species_id: 'ashcat', current_hp: 19 },
        ]);
    });

    it('does not switch when the bench has no conscious battle creature', async () => {
        await addToParty('ashcat', 5);
        await addToParty('applepup', 4);
        await setPartyCurrentHp(0, 1);
        await setPartyCurrentHp(1, 0);
        const player = mockPlayer('hero');

        await activateLeadBattleAvatar(player);
        player.hp = 0;

        await expect(switchToNextAvailableLeadBattleAvatar(player)).resolves.toBeNull();
        expect(player.setGraphic).toHaveBeenLastCalledWith('species_ashcat');
        expect(await getPartyWithHealth()).toMatchObject([
            { slot: 0, species_id: 'ashcat', current_hp: 0 },
            { slot: 1, species_id: 'applepup', current_hp: 0 },
        ]);
    });

    it('leaves the player unchanged when there is no lead creature', async () => {
        const player = mockPlayer('hero');

        await expect(syncLeadCreatureStats(player)).resolves.toBeNull();
        await expect(activateLeadBattleAvatar(player)).resolves.toBeNull();

        expect(player.setGraphic).not.toHaveBeenCalled();
        expect(player.hp).toBe(1);
        expect(player.param).toEqual({});
        expect(player.gui(LEAD_MOVE_BAR_GUI_ID).open).not.toHaveBeenCalled();
    });
});

function mockPlayer(graphic: string): RpgPlayer & {
    hp: number;
    sp: number;
    param: Record<string | number, number>;
    learnSkill: ReturnType<typeof vi.fn>;
    forgetSkill: ReturnType<typeof vi.fn>;
    skills: () => Array<{ id: string }>;
    gui: ReturnType<typeof vi.fn>;
    getGui: ReturnType<typeof vi.fn>;
    setGraphic: ReturnType<typeof vi.fn>;
    graphics: () => string[];
} {
    const state = { graphic };
    const knownSkills: Array<{ id: string }> = [];
    const gui = {
        open: vi.fn(),
        update: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
    };
    const setGraphic = vi.fn((next: string) => {
        state.graphic = next;
    });
    return {
        hp: 1,
        sp: 0,
        param: {},
        skills: () => knownSkills,
        learnSkill: vi.fn((skill: LeadActionBattleSkill | string) => {
            const id = typeof skill === 'string' ? skill : skill.id;
            knownSkills.push({ id });
            return skill;
        }),
        forgetSkill: vi.fn((skillId: string) => {
            const index = knownSkills.findIndex((skill) => skill.id === skillId);
            if (index >= 0) knownSkills.splice(index, 1);
            return { id: skillId };
        }),
        gui: vi.fn(() => gui),
        getGui: vi.fn(() => gui),
        setGraphic,
        graphics: () => [state.graphic],
    } as unknown as RpgPlayer & {
        hp: number;
        sp: number;
        param: Record<string | number, number>;
        learnSkill: ReturnType<typeof vi.fn>;
        forgetSkill: ReturnType<typeof vi.fn>;
        skills: () => Array<{ id: string }>;
        gui: ReturnType<typeof vi.fn>;
        getGui: ReturnType<typeof vi.fn>;
        setGraphic: ReturnType<typeof vi.fn>;
        graphics: () => string[];
    };
}
