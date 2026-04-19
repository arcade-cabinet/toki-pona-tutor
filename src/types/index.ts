export type UsageCategory = 'core' | 'common' | 'uncommon' | 'obscure';

export interface DictionaryEntry {
  word: string;
  definition: string;
  book: string;
  usage_category: UsageCategory;
  source_language: string;
  /** UCSUR codepoint string like 'U+F1908' — maps to nasin-nanpa glyph */
  ucsur?: string;
  /** Emoji representation — e.g. ⚓ for 'awen' */
  sitelen_emosi?: string;
}

export type ChallengeType = 'concept' | 'sentence';

export interface Challenge {
  prompt: string;
  target: string[];
  hint: string;
  type: ChallengeType;
}

export interface WordToken {
  id: string;
  text: string;
}

export type SfxType = 'tap' | 'untap' | 'correct' | 'wrong' | 'win';

export type View = 'menu' | 'learn' | 'results' | 'study' | 'adventure';
