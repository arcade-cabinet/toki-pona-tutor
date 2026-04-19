import { DUNGEON } from '../tiles';

export type MoveKind = 'physical' | 'spirit' | 'calm';

export interface EnemyMove {
  id: string;
  nameTp: string; // what the enemy says/does, real TP
  nameEn: string;
  kind: MoveKind;
  damage: number;
}

export interface EnemyDef {
  id: string;
  nameTp: string;
  nameEn: string;
  /** Flavor line shown when combat starts (canonical TP from Tatoeba) */
  flavorTp: string;
  flavorEn: string;
  /** In-world Tiny Dungeon tile used on overworld */
  spriteFrame: number;
  /** High-res round portrait shown in combat */
  portraitSrc: string;
  /** Stats */
  hp: number;
  attack: number; // damage dealt when they hit the player
  defense: number; // reduces physical damage
  spirit: number; // reduces calm damage
  /** Moves the enemy can use */
  moves: EnemyMove[];
  /** Words the player learns when defeating/calming this creature */
  rewardWords: string[];
  xpReward: number;
}

const PORTRAIT_BASE = import.meta.env.BASE_URL + 'portraits';

export const ENEMIES: Record<string, EnemyDef> = {
  akesi: {
    id: 'akesi',
    nameTp: 'akesi',
    nameEn: 'startled akesi',
    flavorTp: 'akesi li pilin ike.',
    flavorEn: 'The akesi is scared.',
    spriteFrame: DUNGEON.ORC_RED,
    portraitSrc: `${PORTRAIT_BASE}/portrait_pipi.png`,
    hp: 10,
    attack: 2,
    defense: 1,
    spirit: 0,
    moves: [
      { id: 'snap', nameTp: 'utala', nameEn: 'lash out', kind: 'physical', damage: 2 },
      { id: 'hiss', nameTp: 'a a a!', nameEn: 'hiss', kind: 'physical', damage: 1 },
    ],
    rewardWords: ['akesi'],
    xpReward: 30,
  },
};
