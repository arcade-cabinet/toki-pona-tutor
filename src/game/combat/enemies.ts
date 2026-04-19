import { DUNGEON } from '../tiles';

export type GrammarPattern =
  | 'mi_verb_e_obj' // mi + verb + e + [object]
  | 'noun_adj' // noun + modifier
  | 'sina_verb' // sina + verb
  | 'li_predicate' // subject + li + predicate
  | 'any_valid';

export interface EnemyDef {
  id: string;
  nameTp: string;
  nameEn: string;
  flavorTp: string; // line the enemy 'says' when encountered
  flavorEn: string;
  spriteFrame: number;
  hp: number;
  weakPattern: GrammarPattern;
  hintLines: [string, string, string]; // escalating hints
  calmReward: string; // word you learn when you calm this creature
  xpReward: number;
}

export const ENEMIES: Record<string, EnemyDef> = {
  akesi: {
    id: 'akesi',
    nameTp: 'akesi',
    nameEn: 'startled reptile',
    flavorTp: 'akesi li pilin ike. ona li weka e sina.',
    flavorEn: 'The akesi is scared. It wants you to go away.',
    // tile 110 (ORC_RED) — a squat creature sprite that reads as 'critter' not
    // 'ghost'. Son's feedback: previous GHOST sprite looked like a ghost.
    spriteFrame: DUNGEON.ORC_RED,
    hp: 3,
    weakPattern: 'noun_adj',
    hintLines: [
      "Try describing the akesi — it wants to feel seen.",
      "A noun followed by an adjective: like 'akesi pona' (good reptile).",
      "Say: akesi pona (good reptile) — that's the answer.",
    ],
    calmReward: 'akesi',
    xpReward: 30,
  },
};
