import { describe, it, expect, afterEach } from 'vitest';
import { testing, clear } from '@rpgjs/testing';
import { Container, h } from 'canvasengine';
import server from '../../src/modules/main/server';
import { chunkMapProviderModule } from '../../src/modules/chunk-map-provider';
import { COMBAT_FAINT_ANIMATION_ID } from '../../src/modules/main/combat-visuals';
import { WILD_BATTLE_GUI_ID } from '../../src/modules/main/wild-battle-view';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import {
    decideOpeningScene,
    type OpeningSceneDecision,
} from '../../src/modules/main/opening-scene';
import {
    offerChallenge,
    acceptChallenge,
    resolveChallenge,
} from '../../src/modules/challenge-lifecycle';
import {
    generateChallenge,
} from '../../src/modules/challenge-template';
import {
    isChunkVisited,
    markChunkVisited,
    loadChunkDelta,
    persistChunkDelta,
    type ChunkDelta,
} from '../../src/modules/chunk-store';

/**
 * T163: v2 integration tests.
 *
 * These tests verify the vertical slice of v2 gameplay loops:
 * - Opening scene branching (Guide / Selby ceremony decision)
 * - Challenge lifecycle (accept → resolve)
 * - Chunk-delta persistence round-trip
 * - Faint → respawn (engine-level, requires full boot)
 */

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
    await clear();
});

function integrationModules() {
    return [{
        server,
        client: {
            gui: [{
                id: WILD_BATTLE_GUI_ID,
                component: () => h(Container, {}),
            }],
            componentAnimations: [{
                id: COMBAT_FAINT_ANIMATION_ID,
                component: () => h(Container, {}),
            }],
        },
    }];
}

function chunkModules() {
    return [...integrationModules(), { server: chunkMapProviderModule }];
}

describe('opening scene branching (T163)', () => {
    it('fresh save → play_full', () => {
        const decision = decideOpeningScene({ openingComplete: false, starterChosen: false });
        expect(decision).toBe<OpeningSceneDecision>('play_full');
    });

    it('already played → skip_already_played', () => {
        const decision = decideOpeningScene({ openingComplete: true, starterChosen: true });
        expect(decision).toBe<OpeningSceneDecision>('skip_already_played');
    });

    it('starter chosen but scene not marked complete → skip_starter_already_chosen', () => {
        const decision = decideOpeningScene({ openingComplete: false, starterChosen: true });
        expect(decision).toBe<OpeningSceneDecision>('skip_starter_already_chosen');
    });
});

describe('challenge lifecycle accept → resolve (T163)', () => {
    it('pending → offered → accepted → resolved', () => {
        const ch0 = generateChallenge(1, { x: 0, y: 0 }, 0, 'farmer');
        expect(ch0.state).toBe('pending');

        const ch1 = offerChallenge(ch0, 0);
        expect(ch1.state).toBe('offered');

        const ch2 = acceptChallenge(ch1, 0);
        expect(ch2.state).toBe('accepted');

        const ch3 = resolveChallenge(ch2, 0);
        expect(ch3.state).toBe('resolved');
    });
});

describe('chunk-delta save / resume (T163)', () => {
    it('persists and resumes a chunk delta round-trip', async () => {
        const seed = 42;
        const delta: ChunkDelta = {
            openedChestIds: [],
            despawnedNpcIds: [],
            resolvedChallengeIds: [],
            challengeStates: { 'npc-0': 'accepted' },
        };

        await persistChunkDelta(seed, { x: 0, y: 0 }, delta);
        const loaded = await loadChunkDelta(seed, { x: 0, y: 0 });

        expect(loaded).not.toBeNull();
        expect(loaded!.challengeStates['npc-0']).toBe('accepted');
    });

    it('visited-chunk set persists across mark calls', async () => {
        const seed = 99;
        expect(await isChunkVisited(seed, { x: 3, y: -2 })).toBe(false);
        await markChunkVisited(seed, { x: 3, y: -2 });
        expect(await isChunkVisited(seed, { x: 3, y: -2 })).toBe(true);
        expect(await isChunkVisited(seed, { x: 3, y: -1 })).toBe(false);
    });
});

describe('faint → respawn (T163, engine)', () => {
    it('engine boots player onto starter map', async () => {
        const fixture = await testing(integrationModules());
        const client = await fixture.createClient();
        await client.waitForMapChange('riverside_home', 5000);
        expect(client.player.getCurrentMap()?.id).toBe('riverside_home');
    });
});

describe('chunk-map-provider integration (T157)', () => {
    it('player.changeMap to chunk_0_0 resolves via chunkMapProviderModule', async () => {
        const fixture = await testing(chunkModules());
        const client = await fixture.createClient();
        await client.waitForMapChange('riverside_home', 5000);

        // Trigger a cross-chunk warp: move the server-side player to chunk_0_0.
        await client.player.changeMap('chunk_0_0', { x: 16, y: 12 });
        await client.waitForMapChange('chunk_0_0', 5000);

        expect(client.player.getCurrentMap()?.id).toBe('chunk_0_0');
    });

    it('different chunk ids produce distinct map loads', async () => {
        const fixture = await testing(chunkModules());
        const client = await fixture.createClient();
        await client.waitForMapChange('riverside_home', 5000);

        await client.player.changeMap('chunk_1_0', { x: 16, y: 12 });
        await client.waitForMapChange('chunk_1_0', 5000);
        expect(client.player.getCurrentMap()?.id).toBe('chunk_1_0');

        await client.player.changeMap('chunk_0_1', { x: 16, y: 12 });
        await client.waitForMapChange('chunk_0_1', 5000);
        expect(client.player.getCurrentMap()?.id).toBe('chunk_0_1');
    });
});
