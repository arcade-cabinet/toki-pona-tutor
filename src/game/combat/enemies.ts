import { DUNGEON } from '../tiles';

export type GrammarPattern =
  | 'mi_verb_e_obj'
  | 'noun_adj'
  | 'sina_verb'
  | 'li_predicate'
  | 'any_valid';

export interface EnemyDef {
  id: string;
  nameTp: string;
  nameEn: string;
  flavorTp: string;
  flavorEn: string;
  /** In-world Tiny Dungeon tile frame shown on map (16px) */
  spriteFrame: number;
  /** High-res CC0 portrait PNG path shown in combat overlay */
  portraitSrc: string;
  hp: number;
  weakPattern: GrammarPattern;
  hintLines: [string, string, string];
  calmReward: string;
  xpReward: number;
}

const PORTRAIT_BASE = import.meta.env.BASE_URL + 'portraits';

// Honest sprite↔name mapping. Each enemy's combat portrait visually matches
// what its TP name means.
export const ENEMIES: Record<string, EnemyDef> = {
  // Green frog portrait (Animal Pack Redux) → 'akesi' (amphibian/reptile in TP).
  akesi: {
    id: 'akesi',
    nameTp: 'akesi',
    nameEn: 'startled amphibian',
    flavorTp: 'akesi li pilin ike. ona li weka e sina.',
    flavorEn: "The akesi is scared. It wants you to leave.",
    spriteFrame: DUNGEON.ORC_RED, // in-world chunky critter placeholder
    portraitSrc: `${PORTRAIT_BASE}/portrait_pipi.png`, // frog portrait
    hp: 3,
    weakPattern: 'noun_adj',
    hintLines: [
      'Describe the akesi kindly. Noun + adjective.',
      'Try: "akesi pona" (good amphibian) — shows it you mean well.',
      'Say: akesi pona — this is the answer.',
    ],
    calmReward: 'akesi',
    xpReward: 30,
  },
};
