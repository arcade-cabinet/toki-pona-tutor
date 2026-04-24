import { afterEach, describe, expect, it, vi } from 'vitest';
import { clear, testing, type TestingFixture } from '@rpgjs/testing';
import { Container, h } from 'canvasengine';
import { MAXHP, MAXSP, type RpgPlayer, type RpgShape } from '@rpgjs/server';
import server from '../../src/modules/main/server';
import { COMBAT_FAINT_ANIMATION_ID } from '../../src/modules/main/combat-visuals';
import { LEAD_MOVE_BAR_GUI_ID } from '../../src/modules/main/lead-battle-skills';
import { WILD_BATTLE_GUI_ID } from '../../src/modules/main/wild-battle-view';
import { getDatabase } from '../../src/platform/persistence/database';
import { preferences, KEYS } from '../../src/platform/persistence/preferences';
import {
    addToParty,
    getBestiaryState,
    getFlag,
    getParty,
    getPartyWithHealth,
    getClueSightings,
    setPartyCurrentHp,
} from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import { CREDITS_PAGES } from '../../src/modules/main/credits-screen';
import {
    findQuestOrThrow,
    questDoneFlag,
    readQuestState,
    recordQuestEventForActive,
} from '../../src/modules/main/quest-runtime';

type GameClient = Awaited<ReturnType<TestingFixture['createClient']>>;

type UiHarness = {
    texts: string[];
    notifications: string[];
    choose: (...values: Array<string | null>) => void;
};

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
    await clear();
});

describe('journey golden path (integration)', () => {
    it('spawns battle-AI maps without missing-physics warnings', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
            const { player } = await bootIntoFinalRoute();

            expect(player.getCurrentMap()?.id).toBe('rivergate_approach');

            const physicsWarnings = warnSpy.mock.calls
                .map((args) => args.map((value) => String(value)).join(' '))
                .filter((message) => message.includes('Player entity not found in physic engine'));

            expect(physicsWarnings).toEqual([]);
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('runs starter ceremony, unlocks the first gate, and transitions onto greenwood_road', async () => {
        const { player, client } = await bootGame();
        const ui = hijackUi(player);
        const starterMap = player.getCurrentMap();
        const warpEast = starterMap?.getEvent('warp_east');
        const janSewi = starterMap?.getEvent('jan-sewi');

        expect(warpEast).toBeDefined();
        expect(janSewi).toBeDefined();

        await warpEast!.execMethod('onPlayerTouch', [player]);

        expect(player.getCurrentMap()?.id).toBe('riverside_home');
        expect(await getFlag('starter_chosen')).toBeNull();
        expect(ui.texts.length).toBeGreaterThan(0);

        ui.choose('ashcat');
        await janSewi!.execMethod('onAction', [player]);

        expect(await preferences.get(KEYS.starterChosen)).toBe('ashcat');
        expect(await getFlag('starter_chosen')).toBe('1');
        expect(await inventoryCount('capture_pod')).toBe(3);
        expect(await getParty()).toEqual([
            expect.objectContaining({ slot: 0, species_id: 'ashcat', level: 5 }),
        ]);
        expect((await getBestiaryState()).ashcat?.caughtAt).toBeTruthy();
        expect(ui.notifications).toContain('Ashcat');

        const waitForRoute = client.waitForMapChange('greenwood_road', 5000);
        await warpEast!.execMethod('onPlayerTouch', [player]);
        const routePlayer = await waitForRoute;

        expect(routePlayer.getCurrentMap()?.id).toBe('greenwood_road');
        expect(await preferences.get(KEYS.currentMapId)).toBe('greenwood_road');
    });

    it('runs a caught wild encounter on greenwood_road and updates party, logs, and xp', async () => {
        const { player } = await bootIntoRoute();
        const ui = hijackUi(player);
        const encounter = makeNasinWanEncounterShape();

        ui.choose('fight', 'catch');
        await withRandomSequence([0, 0, 0, 0, 0], async () => {
            await player.execMethod('onInShape', [encounter]);
        });

        const party = await getParty();
        const lead = party[0];
        const caught = party[1];

        expect(caught).toEqual(expect.objectContaining({
            slot: 1,
            species_id: 'bramble_imp',
            level: 3,
        }));
        expect(lead?.level).toBe(5);
        expect(lead?.xp).toBe(160);
        expect(ui.texts.some((line) => line.includes('Attack: -'))).toBe(true);
        expect(ui.notifications).toContain('Ashcat +35 XP');
        expect(ui.notifications).toContain('Orchard Fruit ×1');
        expect(await inventoryCount('capture_pod')).toBe(2);
        expect(await inventoryCount('orchard_fruit')).toBe(1);
        expect((await getBestiaryState()).bramble_imp?.caughtAt).toBeTruthy();
        expect(await latestEncounter()).toEqual(expect.objectContaining({
            species_id: 'bramble_imp',
            map_id: 'greenwood_road',
            outcome: 'caught',
        }));
    });

    it('accepts and completes the forest poki side quest through its NPC', async () => {
        const { player } = await bootIntoRoute();
        const ui = hijackUi(player);
        const route = player.getCurrentMap();
        const janPoki = route?.getEvent('jan-poki-nasin');
        const quest = findQuestOrThrow('quest_field_notes');

        expect(janPoki).toBeDefined();

        ui.choose('accept');
        await janPoki!.execMethod('onAction', [player]);

        expect(ui.texts).toContain('Field Notes\nCatch: x2');
        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 0 });

        await recordQuestEventForActive(player, { type: 'catch', speciesId: 'mudgrub', biome: 'forest' });
        await recordQuestEventForActive(player, { type: 'catch', speciesId: 'applepup', biome: 'forest' });

        await expect(readQuestState(quest)).resolves.toEqual({ status: 'active', progress: 2 });
        expect(ui.notifications).toContain('Field Notes: ready');

        await janPoki!.execMethod('onAction', [player]);

        await expect(readQuestState(quest)).resolves.toEqual({ status: 'completed', progress: 2 });
        await expect(getFlag(questDoneFlag(quest.id))).resolves.toBe('1');
        expect(await inventoryCount('heavy_capture_pod')).toBe(1);
        expect(ui.texts).toContain('Quest complete: Field Notes\nHeavy Capture Pod x1\nXP +50\nClue: Capture pods');
        expect(ui.notifications).toContain('Quest complete: Field Notes');
    });

    it('uses a orchard_fruit from the wild encounter item submenu and returns to the action menu', async () => {
        const { player } = await bootIntoRoute();
        const ui = hijackUi(player);
        const encounter = makeNasinWanEncounterShape();

        await addInventory('orchard_fruit', 1);
        (player as unknown as { hp: number }).hp = 5;
        (player as unknown as { param: Record<string | number, number> }).param[MAXHP] = 44;

        ui.choose('item', 'item:orchard_fruit', 'flee');
        await withRandomSequence([0, 0, 0], async () => {
            await player.execMethod('onInShape', [encounter]);
        });

        expect(ui.texts).toContain('Choose an item');
        expect(ui.texts).toContain('Orchard Fruit: +20 HP\nHP 25 / 44');
        expect((player as unknown as { hp: number }).hp).toBe(25);
        expect((await getPartyWithHealth())[0].current_hp).toBe(25);
        expect((await getBestiaryState()).bramble_imp).toEqual(expect.objectContaining({
            seenAt: expect.any(String),
        }));
        expect((await getBestiaryState()).bramble_imp?.caughtAt).toBeUndefined();
        expect(await inventoryCount('orchard_fruit')).toBe(0);
        expect(await latestEncounter()).toEqual(expect.objectContaining({
            species_id: 'bramble_imp',
            map_id: 'greenwood_road',
            outcome: 'fled',
        }));
    });

    it('marks the rival as defeated and unlocks the east gate to highridge_pass', async () => {
        const { player, client } = await bootIntoRoute();
        const ui = hijackUi(player);
        const route = player.getCurrentMap();
        const janIke = route?.getEvent('jan-ike') as (RpgPlayer & {
            battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
        }) | undefined;
        const warpEast = route?.getEvent('warp_east');

        expect(janIke).toBeDefined();
        expect(warpEast).toBeDefined();

        await janIke!.execMethod('onAction', [player]);
        expect(ui.texts.length).toBeGreaterThan(0);
        expect(currentGraphic(player)).toBe('species_ashcat');
        expect((player as unknown as { param: Record<string | number, number> }).param[MAXHP]).toBe(54);
        expect((player as unknown as { param: Record<string | number, number> }).param[MAXSP]).toBe(12);
        expect((player as unknown as { sp: number }).sp).toBe(12);

        await scriptDefeat(janIke, player, async () => (
            await getFlag('rook_defeated')
        ) === '1' && (
            await preferences.get(KEYS.journeyBeat)
        ) === 'beat_03_highridge_pass');

        expect(await getFlag('rook_defeated')).toBe('1');
        expect(await preferences.get(KEYS.journeyBeat)).toBe('beat_03_highridge_pass');
        expect(await inventoryCount('trail_token')).toBe(4);
        expect(ui.notifications).toContain('Trail Token ×4');
        expect(ui.notifications).toContain('Ashcat +100 XP');
        expect(ui.notifications).toContain('Ashcat L5 -> L6');
        expect(currentGraphic(player)).toBe('rivers_protagonist');

        const waitForMountain = client.waitForMapChange('highridge_pass', 5000);
        await warpEast!.execMethod('onPlayerTouch', [player]);
        const mountainPlayer = await waitForMountain;

        expect(mountainPlayer.getCurrentMap()?.id).toBe('highridge_pass');
    });

    it('sends out the next conscious party creature when the action-battle lead faints', async () => {
        const { player } = await bootIntoRoute();
        const ui = hijackUi(player);
        const janIke = player.getCurrentMap()?.getEvent('jan-ike');

        await addToParty('applepup', 4);
        await setPartyCurrentHp(0, 1);
        await setPartyCurrentHp(1, 12);
        await janIke!.execMethod('onAction', [player]);

        expect(currentGraphic(player)).toBe('species_ashcat');

        player.hp = 0;
        await waitFor(async () => currentGraphic(player) === 'species_applepup' && player.hp === 12);

        expect(player.getCurrentMap()?.id).toBe('greenwood_road');
        expect(currentGraphic(player)).toBe('species_applepup');
        expect(player.hp).toBe(12);
        expect(ui.notifications).toContain('Applepup joins in');
        expect(await getPartyWithHealth()).toMatchObject([
            { slot: 0, species_id: 'applepup', current_hp: 12 },
            { slot: 1, species_id: 'ashcat', current_hp: 0 },
        ]);
    });

    it('defeats jan Wawa, grants the badge reward, and opens lakehaven', async () => {
        const { player, client } = await bootIntoMountain();
        const ui = hijackUi(player);
        const mountain = player.getCurrentMap();
        const janWawa = mountain?.getEvent('jan-wawa') as (RpgPlayer & {
            battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
        }) | undefined;
        const warpNorth = mountain?.getEvent('warp_north');

        expect(janWawa).toBeDefined();
        expect(warpNorth).toBeDefined();

        await janWawa!.execMethod('onAction', [player]);
        expect(ui.texts.length).toBeGreaterThan(0);

        await scriptDefeat(janWawa, player, async () => (
            await getFlag('badge_sewi')
        ) === '1' && (
            await preferences.get(KEYS.journeyBeat)
        ) === 'beat_04_lakehaven' && (
            await getClueSightings('highridge-proof')
        ) > 0);

        expect(await getFlag('badge_sewi')).toBe('1');
        expect(await preferences.get(KEYS.journeyBeat)).toBe('beat_04_lakehaven');
        expect(await getClueSightings('highridge-proof')).toBeGreaterThan(0);
        expect(await inventoryCount('trail_token')).toBe(10);
        expect(ui.notifications).toContain('Trail Token ×6');
        expect(ui.notifications).toContain('Ashcat +150 XP');
        expect(ui.notifications).toContain('Ashcat L6 -> L7');

        const waitForVillage = client.waitForMapChange('lakehaven', 5000);
        await warpNorth!.execMethod('onPlayerTouch', [player]);
        const villagePlayer = await waitForVillage;

        expect(villagePlayer.getCurrentMap()?.id).toBe('lakehaven');
    });

    it('buys poki and orchard_fruit from jan Moku with earned trail_token coins', async () => {
        const { player } = await bootIntoLakeVillage();
        const ui = hijackUi(player);
        const village = player.getCurrentMap();
        const janMoku = village?.getEvent('jan-moku');

        expect(janMoku).toBeDefined();
        expect(await inventoryCount('trail_token')).toBe(10);

        ui.choose('buy:capture_pod', 'buy:orchard_fruit', 'back');
        await janMoku!.execMethod('onAction', [player]);

        expect(ui.texts).toContain('Fruit, pods, and tonics. Nothing fancy, all useful.');
        expect(ui.texts).toContain('Trail Token 10');
        expect(ui.texts).toContain('Capture Pod +1\nTrail Token 8');
        expect(ui.texts).toContain('Orchard Fruit +1\nTrail Token 7');
        expect(await inventoryCount('trail_token')).toBe(7);
        expect(await inventoryCount('capture_pod')).toBe(4);
        expect(await inventoryCount('orchard_fruit')).toBe(1);
    });

    it('defeats jan Telo, grants the badge reward, and opens frostvale', async () => {
        const { player, client } = await bootIntoLakeVillage();
        const ui = hijackUi(player);
        const village = player.getCurrentMap();
        const janTelo = village?.getEvent('jan-telo') as (RpgPlayer & {
            battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
        }) | undefined;
        const warpNorth = village?.getEvent('warp_north');

        expect(janTelo).toBeDefined();
        expect(warpNorth).toBeDefined();

        await janTelo!.execMethod('onAction', [player]);
        expect(ui.texts.length).toBeGreaterThan(0);

        await scriptDefeat(janTelo, player, async () => (
            await getFlag('badge_telo')
        ) === '1' && (
            await preferences.get(KEYS.journeyBeat)
        ) === 'beat_05_frostvale' && (
            await getClueSightings('lakehaven-proof')
        ) > 0);

        expect(await getFlag('badge_telo')).toBe('1');
        expect(await preferences.get(KEYS.journeyBeat)).toBe('beat_05_frostvale');
        expect(await getClueSightings('lakehaven-proof')).toBeGreaterThan(0);

        const waitForIceVillage = client.waitForMapChange('frostvale', 5000);
        await warpNorth!.execMethod('onPlayerTouch', [player]);
        const iceVillagePlayer = await waitForIceVillage;

        expect(iceVillagePlayer.getCurrentMap()?.id).toBe('frostvale');
    });

    it('defeats jan Lete, grants the badge reward, and opens dreadpeak_cavern', async () => {
        const { player, client } = await bootIntoIceVillage();
        const ui = hijackUi(player);
        const iceVillage = player.getCurrentMap();
        const janLete = iceVillage?.getEvent('jan-lete') as (RpgPlayer & {
            battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
        }) | undefined;
        const warpNorth = iceVillage?.getEvent('warp_north');

        expect(janLete).toBeDefined();
        expect(warpNorth).toBeDefined();

        await janLete!.execMethod('onAction', [player]);
        expect(ui.texts.length).toBeGreaterThan(0);

        await scriptDefeat(janLete, player, async () => (
            await getFlag('badge_lete')
        ) === '1' && (
            await preferences.get(KEYS.journeyBeat)
        ) === 'beat_06_dreadpeak_cavern' && (
            await getClueSightings('frostvale-proof')
        ) > 0);

        expect(await getFlag('badge_lete')).toBe('1');
        expect(await preferences.get(KEYS.journeyBeat)).toBe('beat_06_dreadpeak_cavern');
        expect(await getClueSightings('frostvale-proof')).toBeGreaterThan(0);

        const waitForGreatPeak = client.waitForMapChange('dreadpeak_cavern', 5000);
        await warpNorth!.execMethod('onPlayerTouch', [player]);
        const greatPeakPlayer = await waitForGreatPeak;

        expect(greatPeakPlayer.getCurrentMap()?.id).toBe('dreadpeak_cavern');
    });

    it('defeats jan Suli, grants the badge reward, and opens rivergate_approach', async () => {
        const { player, client } = await bootIntoGreatPeak();
        const ui = hijackUi(player);
        const greatPeak = player.getCurrentMap();
        const janSuli = greatPeak?.getEvent('jan-suli') as (RpgPlayer & {
            battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
        }) | undefined;
        const warpNorth = greatPeak?.getEvent('warp_north');

        expect(janSuli).toBeDefined();
        expect(warpNorth).toBeDefined();

        await janSuli!.execMethod('onAction', [player]);
        expect(ui.texts.length).toBeGreaterThan(0);

        await scriptDefeat(janSuli, player, async () => (
            await getFlag('badge_suli')
        ) === '1' && (
            await preferences.get(KEYS.journeyBeat)
        ) === 'beat_07_rivergate_approach' && (
            await getClueSightings('dreadpeak-proof')
        ) > 0);

        expect(await getFlag('badge_suli')).toBe('1');
        expect(await preferences.get(KEYS.journeyBeat)).toBe('beat_07_rivergate_approach');
        expect(await getClueSightings('dreadpeak-proof')).toBeGreaterThan(0);

        const waitForFinalRoute = client.waitForMapChange('rivergate_approach', 5000);
        await warpNorth!.execMethod('onPlayerTouch', [player]);
        const finalRoutePlayer = await waitForFinalRoute;

        expect(finalRoutePlayer.getCurrentMap()?.id).toBe('rivergate_approach');
    });

    it('keeps the final boss trigger silent before all four badges are earned', async () => {
        const { player } = await bootGame();
        const ui = hijackUi(player);

        await player.execMethod('onInShape', [{ name: 'final_boss_trigger', properties: {} } as RpgShape]);

        expect(ui.texts).toEqual([]);
        expect(await getFlag('green_dragon_defeated')).toBeNull();
        expect(await getFlag('game_cleared')).toBeNull();
    });

    it('defeats the green dragon and persists the ending state', async () => {
        const { player } = await bootIntoFinalRoute();
        const ui = hijackUi(player);
        const finalRoute = player.getCurrentMap();
        const greenDragon = finalRoute?.getEvent('green-dragon') as (RpgPlayer & {
            battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
        }) | undefined;

        expect(greenDragon).toBeDefined();

        await player.execMethod('onInShape', [{ name: 'final_boss_trigger', properties: {} } as RpgShape]);
        expect(ui.texts.length).toBeGreaterThan(0);

        await greenDragon!.execMethod('onAction', [player]);
        expect(ui.texts.length).toBeGreaterThan(0);

        await scriptDefeat(greenDragon, player, async () => (
            await getFlag('green_dragon_defeated')
        ) === '1' && (
            await getFlag('game_cleared')
        ) === '1' && (
            await preferences.get(KEYS.journeyBeat)
        ) === 'ending' && (
            await getClueSightings('green-dragon-proof')
        ) > 0 && CREDITS_PAGES.every((page) => ui.texts.includes(page)));

        expect(await getFlag('green_dragon_defeated')).toBe('1');
        expect(await getFlag('game_cleared')).toBe('1');
        expect(await preferences.get(KEYS.journeyBeat)).toBe('ending');
        expect(await getClueSightings('green-dragon-proof')).toBeGreaterThan(0);
        expect(CREDITS_PAGES.every((page) => ui.texts.includes(page))).toBe(true);
    });

    it('respawns at the last safe village instead of the current route', async () => {
        const { player, client } = await bootGame();
        hijackUi(player);

        const waitForVillage = client.waitForMapChange('lakehaven', 5000);
        await player.changeMap('lakehaven', { x: 40, y: 104 });
        const villagePlayer = await waitForVillage;

        const waitForRoute = client.waitForMapChange('greenwood_road', 5000);
        await villagePlayer.changeMap('greenwood_road', { x: 96, y: 80 });
        const routePlayer = await waitForRoute;
        hijackUi(routePlayer);

        const maxHp = Number((routePlayer as unknown as { param?: Record<string | number, number> }).param?.[MAXHP] ?? 0);
        expect(maxHp).toBeGreaterThan(0);

        routePlayer.hp = 1;
        const waitForRespawn = client.waitForMapChange('lakehaven', 5000);
        await routePlayer.execMethod('onDead');
        const respawnedPlayer = await waitForRespawn;

        expect(respawnedPlayer.getCurrentMap()?.id).toBe('lakehaven');
        expect(respawnedPlayer.hp).toBe(maxHp);
        expect(await preferences.get(KEYS.currentMapId)).toBe('lakehaven');
    });

    it('restores external progression data on manual save/load round-trip', async () => {
        const { player, client } = await bootIntoRoute();
        hijackUi(player);

        await preferences.set(KEYS.journeyBeat, 'beat_02_greenwood_road');
        await player.save(1);

        await preferences.set(KEYS.journeyBeat, 'mutated');
        const waitForVillage = client.waitForMapChange('riverside_home', 5000);
        await player.changeMap('riverside_home', { x: 128, y: 128 });
        await waitForVillage;
        await addInventory('orchard_fruit', 5);

        const loadResult = await player.load(1, { reason: 'manual', source: 'test' }, { changeMap: true });
        expect(loadResult?.ok).toBe(true);

        const loadedPlayer = await client.waitForMapChange('greenwood_road', 5000);

        expect(loadedPlayer.getCurrentMap()?.id).toBe('greenwood_road');
        expect(await preferences.get(KEYS.journeyBeat)).toBe('beat_02_greenwood_road');
        expect(await inventoryCount('orchard_fruit')).toBe(0);
        expect(await getParty()).toEqual([
            expect.objectContaining({ slot: 0, species_id: 'ashcat', level: 5 }),
        ]);
    });
});

async function bootGame(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const fixture = await testing(integrationModules());
    const client = await fixture.createClient();
    const player = await client.waitForMapChange('riverside_home', 5000);
    return { client, player };
}

function integrationModules() {
    return [{
        server,
        client: {
            gui: [{
                id: WILD_BATTLE_GUI_ID,
                component: () => h(Container, {}),
            }, {
                id: LEAD_MOVE_BAR_GUI_ID,
                component: () => h(Container, {}),
            }],
            componentAnimations: [{
                id: COMBAT_FAINT_ANIMATION_ID,
                component: () => h(Container, {}),
            }],
        },
    }];
}

async function bootIntoRoute(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const game = await bootGame();
    const ui = hijackUi(game.player);
    const starterMap = game.player.getCurrentMap();
    const janSewi = starterMap?.getEvent('jan-sewi');
    const warpEast = starterMap?.getEvent('warp_east');

    ui.choose('ashcat');
    await janSewi!.execMethod('onAction', [game.player]);

    const waitForRoute = game.client.waitForMapChange('greenwood_road', 5000);
    await warpEast!.execMethod('onPlayerTouch', [game.player]);
    const routePlayer = await waitForRoute;
    await waitFor(async () => {
        const rival = routePlayer.getCurrentMap()?.getEvent('jan-ike') as {
            battleAi?: { onDefeatedCallback?: unknown };
        } | undefined;
        return typeof rival?.battleAi?.onDefeatedCallback === 'function';
    }, 1000);

    return { client: game.client, player: routePlayer };
}

async function bootIntoMountain(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const game = await bootIntoRoute();
    hijackUi(game.player);
    const route = game.player.getCurrentMap();
    const janIke = route?.getEvent('jan-ike') as (RpgPlayer & {
        battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
    }) | undefined;
    const warpEast = route?.getEvent('warp_east');

    if (typeof janIke?.battleAi?.onDefeatedCallback !== 'function' || !warpEast) {
        throw new Error('bootIntoMountain could not resolve jan Ike progression hooks');
    }

    await scriptDefeat(janIke, game.player, async () => (
        await getFlag('rook_defeated')
    ) === '1');
    const waitForMountain = game.client.waitForMapChange('highridge_pass', 5000);
    await warpEast.execMethod('onPlayerTouch', [game.player]);
    const mountainPlayer = await waitForMountain;
    await waitFor(async () => {
        const leader = mountainPlayer.getCurrentMap()?.getEvent('jan-wawa') as {
            battleAi?: { onDefeatedCallback?: unknown };
        } | undefined;
        return typeof leader?.battleAi?.onDefeatedCallback === 'function';
    }, 1000);

    return { client: game.client, player: mountainPlayer };
}

async function bootIntoLakeVillage(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const game = await bootIntoMountain();
    hijackUi(game.player);
    const mountain = game.player.getCurrentMap();
    const janWawa = mountain?.getEvent('jan-wawa') as (RpgPlayer & {
        battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
    }) | undefined;
    const warpNorth = mountain?.getEvent('warp_north');

    if (typeof janWawa?.battleAi?.onDefeatedCallback !== 'function' || !warpNorth) {
        throw new Error('bootIntoLakeVillage could not resolve jan Wawa progression hooks');
    }

    await scriptDefeat(janWawa, game.player, async () => (
        await getFlag('badge_sewi')
    ) === '1');
    const waitForVillage = game.client.waitForMapChange('lakehaven', 5000);
    await warpNorth.execMethod('onPlayerTouch', [game.player]);
    const villagePlayer = await waitForVillage;
    await waitFor(async () => {
        const leader = villagePlayer.getCurrentMap()?.getEvent('jan-telo') as {
            battleAi?: { onDefeatedCallback?: unknown };
        } | undefined;
        return typeof leader?.battleAi?.onDefeatedCallback === 'function';
    }, 1000);

    return { client: game.client, player: villagePlayer };
}

async function bootIntoIceVillage(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const game = await bootIntoLakeVillage();
    hijackUi(game.player);
    const village = game.player.getCurrentMap();
    const janTelo = village?.getEvent('jan-telo') as (RpgPlayer & {
        battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
    }) | undefined;
    const warpNorth = village?.getEvent('warp_north');

    if (typeof janTelo?.battleAi?.onDefeatedCallback !== 'function' || !warpNorth) {
        throw new Error('bootIntoIceVillage could not resolve jan Telo progression hooks');
    }

    await scriptDefeat(janTelo, game.player, async () => (
        await getFlag('badge_telo')
    ) === '1');
    const waitForIceVillage = game.client.waitForMapChange('frostvale', 5000);
    await warpNorth.execMethod('onPlayerTouch', [game.player]);
    const iceVillagePlayer = await waitForIceVillage;
    await waitFor(async () => {
        const leader = iceVillagePlayer.getCurrentMap()?.getEvent('jan-lete') as {
            battleAi?: { onDefeatedCallback?: unknown };
        } | undefined;
        return typeof leader?.battleAi?.onDefeatedCallback === 'function';
    }, 1000);

    return { client: game.client, player: iceVillagePlayer };
}

async function bootIntoGreatPeak(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const game = await bootIntoIceVillage();
    hijackUi(game.player);
    const iceVillage = game.player.getCurrentMap();
    const janLete = iceVillage?.getEvent('jan-lete') as (RpgPlayer & {
        battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
    }) | undefined;
    const warpNorth = iceVillage?.getEvent('warp_north');

    if (typeof janLete?.battleAi?.onDefeatedCallback !== 'function' || !warpNorth) {
        throw new Error('bootIntoGreatPeak could not resolve jan Lete progression hooks');
    }

    await scriptDefeat(janLete, game.player, async () => (
        await getFlag('badge_lete')
    ) === '1');
    const waitForGreatPeak = game.client.waitForMapChange('dreadpeak_cavern', 5000);
    await warpNorth.execMethod('onPlayerTouch', [game.player]);
    const greatPeakPlayer = await waitForGreatPeak;
    await waitFor(async () => {
        const leader = greatPeakPlayer.getCurrentMap()?.getEvent('jan-suli') as {
            battleAi?: { onDefeatedCallback?: unknown };
        } | undefined;
        return typeof leader?.battleAi?.onDefeatedCallback === 'function';
    }, 1000);

    return { client: game.client, player: greatPeakPlayer };
}

async function bootIntoFinalRoute(): Promise<{ client: GameClient; player: RpgPlayer }> {
    const game = await bootIntoGreatPeak();
    hijackUi(game.player);
    const greatPeak = game.player.getCurrentMap();
    const janSuli = greatPeak?.getEvent('jan-suli') as (RpgPlayer & {
        battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
    }) | undefined;
    const warpNorth = greatPeak?.getEvent('warp_north');

    if (typeof janSuli?.battleAi?.onDefeatedCallback !== 'function' || !warpNorth) {
        throw new Error('bootIntoFinalRoute could not resolve jan Suli progression hooks');
    }

    await scriptDefeat(janSuli, game.player, async () => (
        await getFlag('badge_suli')
    ) === '1');
    const waitForFinalRoute = game.client.waitForMapChange('rivergate_approach', 5000);
    await warpNorth.execMethod('onPlayerTouch', [game.player]);
    const finalRoutePlayer = await waitForFinalRoute;
    await waitFor(async () => {
        const boss = finalRoutePlayer.getCurrentMap()?.getEvent('green-dragon') as {
            battleAi?: { onDefeatedCallback?: unknown };
        } | undefined;
        return typeof boss?.battleAi?.onDefeatedCallback === 'function';
    }, 1000);

    return { client: game.client, player: finalRoutePlayer };
}

function hijackUi(player: RpgPlayer): UiHarness {
    const texts: string[] = [];
    const notifications: string[] = [];
    const queuedChoices: Array<string | null> = [];
    const mutablePlayer = player as unknown as {
        showText: (message: string) => Promise<number>;
        showChoices: (message: string, choices: Array<{ text: string; value: string }>) => Promise<{ text: string; value: string } | null>;
        showNotification: (message: string) => Promise<boolean>;
    };

    mutablePlayer.showText = async (message: string) => {
        texts.push(String(message));
        return 0;
    };

    mutablePlayer.showChoices = async (message: string, choices: Array<{ text: string; value: string }>) => {
        texts.push(String(message));
        const next = queuedChoices.shift();
        if (next === undefined || next === null) return null;
        const chosen = choices.find((choice) => choice.value === next || choice.text === next);
        if (!chosen) {
            throw new Error(`Choice ${next} was not offered. Available: ${choices.map((choice) => choice.value).join(', ')}`);
        }
        return chosen;
    };

    mutablePlayer.showNotification = async (message: string) => {
        notifications.push(String(message));
        return true;
    };

    return {
        texts,
        notifications,
        choose: (...values: Array<string | null>) => {
            queuedChoices.push(...values);
        },
    };
}

async function inventoryCount(itemId: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.query(
        'SELECT count FROM inventory_items WHERE item_id = ? LIMIT 1',
        [itemId],
    );
    return Number(result.values?.[0]?.count ?? 0);
}

async function addInventory(itemId: string, count: number): Promise<void> {
    const db = await getDatabase();
    await db.run(
        `INSERT INTO inventory_items (item_id, count, added_at)
         VALUES (?, ?, ?)
         ON CONFLICT(item_id) DO UPDATE SET count = count + excluded.count`,
        [itemId, count, new Date().toISOString()],
    );
}

async function latestEncounter(): Promise<Record<string, unknown> | null> {
    const db = await getDatabase();
    const result = await db.query(
        'SELECT species_id, map_id, outcome FROM encounter_log ORDER BY id DESC LIMIT 1',
    );
    return (result.values?.[0] as Record<string, unknown> | undefined) ?? null;
}

function makeNasinWanEncounterShape(): RpgShape {
    return {
        name: 'encounter_0',
        properties: {
            type: 'Encounter',
            species: '{"bramble_imp":25,"thornling":20,"mirthcat":20,"applepup":15,"mudgrub":10,"nightjar":10}',
            level_min: 3,
            level_max: 5,
        },
    } as RpgShape;
}

async function withRandomSequence<T>(values: number[], run: () => Promise<T>): Promise<T> {
    const originalRandom = Math.random;
    let index = 0;
    Math.random = () => {
        if (index >= values.length) {
            throw new Error(`Math.random exhausted after ${values.length} calls`);
        }
        const next = values[index];
        index += 1;
        return next;
    };

    try {
        return await run();
    } finally {
        Math.random = originalRandom;
    }
}

function currentGraphic(player: RpgPlayer): string | null {
    const graphics = (player as unknown as { graphics?: () => unknown }).graphics?.();
    if (Array.isArray(graphics)) {
        return graphics.find((graphic): graphic is string => typeof graphic === 'string') ?? null;
    }
    return typeof graphics === 'string' ? graphics : null;
}

async function scriptDefeat(
    event: (RpgPlayer & {
        battleAi?: { onDefeatedCallback?: (event: unknown, attacker?: RpgPlayer) => Promise<void> | void };
        hp?: number;
        remove?: () => void;
    }) | undefined,
    attacker: RpgPlayer,
    awaitEffect?: () => Promise<boolean>,
): Promise<void> {
    const onDefeated = event?.battleAi?.onDefeatedCallback;
    expect(typeof onDefeated).toBe('function');
    void onDefeated?.(event as unknown, attacker);

    if (event) {
        event.hp = 0;
        event.remove?.();
    }

    if (awaitEffect) {
        await waitFor(async () => await awaitEffect());
    }
}

async function waitFor(predicate: () => Promise<boolean>, timeoutMs = 2000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error(`Condition did not pass within ${timeoutMs}ms`);
}
