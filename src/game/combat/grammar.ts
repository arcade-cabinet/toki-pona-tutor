import type { GrammarPattern } from './enemies';
import { dictionary } from '../../lib/challenges';

const dictionarySet = new Set(dictionary.map((w) => w.word));
const PARTICLES = new Set(['li', 'e', 'la', 'pi']);
const PRONOUNS = new Set(['mi', 'sina', 'ona']);

/** Every word must be in dictionary, no sentence-initial particles, etc. */
export function isGrammaticallyValid(tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  for (const t of tokens) if (!dictionarySet.has(t)) return false;
  if (PARTICLES.has(tokens[0])) return false;
  const subj = tokens[0];
  if ((subj === 'mi' || subj === 'sina') && tokens.includes('li')) return false;
  for (let i = 1; i < tokens.length; i++) {
    if (PARTICLES.has(tokens[i]) && tokens[i] === tokens[i - 1]) return false;
  }
  return true;
}

/** Does the sentence match the given grammar pattern? */
export function matchesPattern(tokens: string[], pattern: GrammarPattern): boolean {
  if (!isGrammaticallyValid(tokens)) return false;
  switch (pattern) {
    case 'any_valid':
      return true;

    case 'noun_adj':
      // At minimum: noun + adjective (2 tokens, no particles, no pronoun subject)
      if (tokens.length < 2) return false;
      if (PRONOUNS.has(tokens[0])) return false; // 'mi pona' is also valid TP but we want generic N+A
      if (tokens.some((t) => PARTICLES.has(t))) return false;
      return true;

    case 'mi_verb_e_obj':
      // mi + verb + e + object (exactly 4 tokens for this minimum pattern)
      return (
        tokens.length >= 4 &&
        tokens[0] === 'mi' &&
        tokens[2] === 'e' &&
        tokens[1] !== 'li' &&
        !PARTICLES.has(tokens[1])
      );

    case 'sina_verb':
      return tokens.length >= 2 && tokens[0] === 'sina' && !PARTICLES.has(tokens[1]);

    case 'li_predicate':
      // subject + li + predicate (at least 3 tokens; subject not mi/sina)
      if (tokens.length < 3) return false;
      if (PRONOUNS.has(tokens[0]) && (tokens[0] === 'mi' || tokens[0] === 'sina'))
        return false;
      return tokens.includes('li');
  }
}

export type DamageTier = 'weak' | 'normal' | 'partial';

export function classifyDamage(tokens: string[], weakPattern: GrammarPattern): DamageTier {
  if (matchesPattern(tokens, weakPattern)) return 'weak';
  if (isGrammaticallyValid(tokens)) return 'normal';
  return 'partial';
}
