/**
 * wan sitelen — pick-the-sentence micro-game — T8-05.
 *
 * Optional language-practice mini-game at the starter village. The
 * player sees a pictorial prompt (a scene / emoji / glyph) and picks
 * which of 4 TP sentences describes it. No EN shown anywhere.
 *
 * The round generator is pure: given a pool of (prompt, correctTp)
 * pairs plus a RNG, it builds a round with 3 distractors drawn from
 * the same pool (never the correct answer) and a shuffled option
 * order. Same seed → same round — deterministic for tests and for
 * "daily challenge" mode where every player sees the same 10 rounds.
 *
 * Scoring is the other pure function: given a round and the player's
 * pick, it reports correct/incorrect + a running score.
 */

export interface SentencePrompt {
    /** Stable id — species id, dialog id, or event tag. */
    id: string;
    /** What the player sees. For v1 this is a short EN phrase used as
     *  a pointer to a glyph asset — runtime swaps it for the actual image. */
    prompt_tag: string;
    /** Canonical TP sentence that matches the prompt. */
    tp: string;
}

export interface Round {
    prompt: SentencePrompt;
    /** 4 shuffled options; exactly one matches prompt.tp. */
    options: string[];
    /** Index into `options` of the correct answer. */
    correctIndex: number;
}

export interface GameResult {
    correct: boolean;
    score: number;
}

/** Linear-congruential PRNG — deterministic, same seed → same stream. */
export function makeRng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

/**
 * Fisher-Yates shuffle using the provided RNG. Returns a new array;
 * does not mutate input.
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/**
 * Build one round from the pool. Throws if the pool has < 4 distinct
 * TP strings (need 1 correct + 3 distractors). Distractors are drawn
 * without replacement; if two pool entries share the same TP (possible
 * after dedup bugs) we skip duplicates.
 *
 * @example
 * const pool = [
 *   { id: 'soweli', prompt_tag: 'animal', tp: 'soweli li lon.' },
 *   { id: 'kala',   prompt_tag: 'fish',   tp: 'kala li lon telo.' },
 *   { id: 'waso',   prompt_tag: 'bird',   tp: 'waso li tawa sewi.' },
 *   { id: 'kili',   prompt_tag: 'fruit',  tp: 'kili li suwi.' },
 * ];
 * const round = buildRound(pool, pool[0], makeRng(42));
 * // → { prompt: pool[0], options: [...4 shuffled tp strings...], correctIndex: N }
 */
export function buildRound(
    pool: readonly SentencePrompt[],
    prompt: SentencePrompt,
    rng: () => number,
): Round {
    const pickedTps = new Set<string>([prompt.tp]);
    const distractors: string[] = [];

    // Shuffle pool once; walk it picking unique-TP distractors.
    const shuffled = shuffle(pool, rng);
    for (const entry of shuffled) {
        if (distractors.length >= 3) break;
        if (pickedTps.has(entry.tp)) continue;
        distractors.push(entry.tp);
        pickedTps.add(entry.tp);
    }
    if (distractors.length < 3) {
        throw new Error(
            `buildRound: pool has ${pickedTps.size} distinct TP strings, need at least 4`,
        );
    }

    const options = shuffle([prompt.tp, ...distractors], rng);
    const correctIndex = options.indexOf(prompt.tp);

    return { prompt, options, correctIndex };
}

/**
 * Build a deterministic N-round sequence from a seed. The same seed +
 * pool always produces the same rounds — suitable for a "daily
 * challenge" that every player sees in sync.
 */
export function buildSequence(pool: readonly SentencePrompt[], count: number, seed: number): Round[] {
    if (pool.length < 4) {
        throw new Error(`buildSequence: pool of ${pool.length} cannot produce rounds`);
    }
    const rng = makeRng(seed);
    const prompts = shuffle(pool, rng).slice(0, count);
    return prompts.map((p) => buildRound(pool, p, rng));
}

/**
 * Grade a player's pick for a single round. Returns { correct, score }
 * where score is the running total (prev + 1 if correct, else prev).
 */
export function gradePick(round: Round, pickedIndex: number, previousScore: number): GameResult {
    const correct = pickedIndex === round.correctIndex;
    return {
        correct,
        score: correct ? previousScore + 1 : previousScore,
    };
}
