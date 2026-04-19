import dictionaryData from '../content/dictionary.json';
import challengesData from '../content/challenges.json';
import type { Challenge, DictionaryEntry, WordToken } from '../types';

export const dictionary = dictionaryData as DictionaryEntry[];
export const challenges = challengesData as Challenge[];

const dictionaryByWord = new Map(dictionary.map((w) => [w.word, w]));

export function lookup(word: string): DictionaryEntry | undefined {
  return dictionaryByWord.get(word);
}

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildWordBank(challenge: Challenge, distractorCount = 5): WordToken[] {
  const targetSet = new Set(challenge.target);
  const pool = dictionary.filter((w) => !targetSet.has(w.word)).map((w) => w.word);
  const distractors = shuffle(pool).slice(0, distractorCount);
  const bank = shuffle([...challenge.target, ...distractors]);
  return bank.map((text, i) => ({ id: `w-${i}-${text}`, text }));
}

export function isAnswerCorrect(selected: readonly WordToken[], challenge: Challenge): boolean {
  if (selected.length !== challenge.target.length) return false;
  return selected.every((w, i) => w.text === challenge.target[i]);
}
