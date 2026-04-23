import { describe, it, expect } from 'vitest';
import type { RpgPlayer } from '@rpgjs/server';
import { MICRO_GAME_CONFIG } from '../../src/content/gameplay';
import {
    makeRng,
    shuffle,
    buildRound,
    buildSequence,
    gradePick,
    playMicroGame,
    type SentencePrompt,
} from '../../src/modules/main/micro-game';

const pool: SentencePrompt[] = [
    { id: 'creature', prompt_tag: 'animal', text: 'A creature waits nearby.' },
    { id: 'fish', prompt_tag: 'fish', text: 'Something moves under the water.' },
    { id: 'bird', prompt_tag: 'bird', text: 'A bird circles in the wind.' },
    { id: 'fruit', prompt_tag: 'fruit', text: 'Fresh fruit can restore strength.' },
    { id: 'house', prompt_tag: 'house', text: 'The house is safe for now.' },
    { id: 'fire', prompt_tag: 'fire', text: 'The fire burns bright and strong.' },
];

describe('makeRng — deterministic', () => {
    it('same seed produces same stream', () => {
        const a = makeRng(42);
        const b = makeRng(42);
        for (let i = 0; i < 10; i++) expect(a()).toBe(b());
    });

    it('different seeds diverge', () => {
        const a = makeRng(1);
        const b = makeRng(2);
        expect(a()).not.toBe(b());
    });

    it('values stay in [0, 1)', () => {
        const rng = makeRng(7);
        for (let i = 0; i < 100; i++) {
            const v = rng();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });
});

describe('shuffle — new array, same contents', () => {
    it('returns same length', () => {
        const out = shuffle([1, 2, 3, 4, 5], makeRng(1));
        expect(out).toHaveLength(5);
    });

    it('contains the same elements (set-equal)', () => {
        const input = [1, 2, 3, 4, 5];
        const out = shuffle(input, makeRng(3));
        expect(new Set(out)).toEqual(new Set(input));
    });

    it('does not mutate input', () => {
        const input = [1, 2, 3];
        const snapshot = [...input];
        shuffle(input, makeRng(1));
        expect(input).toEqual(snapshot);
    });

    it('same seed → same shuffled order', () => {
        const a = shuffle([1, 2, 3, 4, 5], makeRng(42));
        const b = shuffle([1, 2, 3, 4, 5], makeRng(42));
        expect(a).toEqual(b);
    });
});

describe('buildRound — one correct + 3 distractors', () => {
    it('produces exactly 4 options', () => {
        const round = buildRound(pool, pool[0], makeRng(1));
        expect(round.options).toHaveLength(4);
    });

    it('correctIndex references a string equal to prompt.text', () => {
        const round = buildRound(pool, pool[0], makeRng(1));
        expect(round.options[round.correctIndex]).toBe(pool[0].text);
    });

    it('options are all distinct', () => {
        const round = buildRound(pool, pool[0], makeRng(1));
        expect(new Set(round.options).size).toBe(4);
    });

    it('throws when pool has < 4 distinct text strings', () => {
        const small = pool.slice(0, 3);
        expect(() => buildRound(small, small[0], makeRng(1))).toThrow(/need at least 4/);
    });

    it('handles pool duplicates (same text under different ids) without crashing', () => {
        const dupPool: SentencePrompt[] = [
            ...pool,
            { id: 'creature_alt', prompt_tag: 'animal2', text: pool[0].text }, // dup text
        ];
        const round = buildRound(dupPool, pool[0], makeRng(5));
        expect(new Set(round.options).size).toBe(4);
    });

    it('is deterministic for the same (pool, prompt, seed)', () => {
        const a = buildRound(pool, pool[2], makeRng(99));
        const b = buildRound(pool, pool[2], makeRng(99));
        expect(a.options).toEqual(b.options);
        expect(a.correctIndex).toBe(b.correctIndex);
    });
});

describe('buildSequence — deterministic N-round batch', () => {
    it('produces N rounds', () => {
        const rounds = buildSequence(pool, 3, 42);
        expect(rounds).toHaveLength(3);
    });

    it('N=0 produces empty sequence', () => {
        expect(buildSequence(pool, 0, 42)).toEqual([]);
    });

    it('every round has a correct answer', () => {
        const rounds = buildSequence(pool, 5, 123);
        for (const r of rounds) {
            expect(r.options[r.correctIndex]).toBe(r.prompt.text);
        }
    });

    it('same seed → identical sequence (daily-challenge property)', () => {
        const a = buildSequence(pool, 4, 777);
        const b = buildSequence(pool, 4, 777);
        expect(a).toEqual(b);
    });

    it('throws on under-sized pool', () => {
        expect(() => buildSequence(pool.slice(0, 3), 1, 1)).toThrow();
    });
});

describe('gradePick — scoring', () => {
    const round = buildRound(pool, pool[0], makeRng(1));

    it('correct pick increments score', () => {
        expect(gradePick(round, round.correctIndex, 3).score).toBe(4);
    });

    it('correct pick returns correct: true', () => {
        expect(gradePick(round, round.correctIndex, 0).correct).toBe(true);
    });

    it('wrong pick preserves score', () => {
        const wrongIndex = (round.correctIndex + 1) % 4;
        expect(gradePick(round, wrongIndex, 3).score).toBe(3);
    });

    it('wrong pick returns correct: false', () => {
        const wrongIndex = (round.correctIndex + 1) % 4;
        expect(gradePick(round, wrongIndex, 0).correct).toBe(false);
    });
});

describe('playMicroGame — RPG.js choice binding', () => {
    it('runs configured rounds with English choices and deterministic scoring', async () => {
        const rounds = buildSequence(
            MICRO_GAME_CONFIG.pool,
            MICRO_GAME_CONFIG.roundCount,
            MICRO_GAME_CONFIG.seed,
        );
        const prompts: string[] = [];
        const choicesSeen: string[][] = [];
        const texts: string[] = [];
        let roundIndex = 0;
        const player = {
            showChoices: async (
                message: string,
                choices: Array<{ text: string; value: string }>,
            ) => {
                const round = rounds[roundIndex];
                roundIndex += 1;
                prompts.push(message);
                choicesSeen.push(choices.map((choice) => choice.text));
                return choices.find((choice) => choice.text === round?.prompt.text) ?? null;
            },
            showText: async (line: string) => {
                texts.push(line);
            },
        } as unknown as RpgPlayer;

        const result = await playMicroGame(player);

        expect(result).toEqual({ completed: true, score: 3, total: 3 });
        expect(prompts[0]).toContain('1/3');
        expect(choicesSeen).toHaveLength(3);
        expect(choicesSeen.flat().every((choice) =>
            MICRO_GAME_CONFIG.pool.some((entry) => entry.text === choice),
        )).toBe(true);
        expect(texts).toContain('Field notes complete: 3/3');
    });

    it('returns incomplete when the choice dialog is cancelled', async () => {
        const player = {
            showChoices: async () => null,
            showText: async () => {},
        } as unknown as RpgPlayer;

        await expect(playMicroGame(player)).resolves.toEqual({
            completed: false,
            score: 0,
            total: 3,
        });
    });
});
