import type { Seed } from './seed';
import { seedToRng } from './seed';
import { TOWN } from '../tiles';

export interface BiomeTheme {
  /** Background color for the Phaser scene (visible under grass) */
  skyColor: string;
  /** Grass tint applied as a tinted overlay — not every tile, just mood */
  moodHex: string;
  /** Pool of border tree frames — picks vary the feel */
  treeFrames: number[];
  /** Named variant — used in UI copy */
  label: string;
}

const BIOME_THEMES: Record<string, BiomeTheme> = {
  pona: {
    skyColor: '#8bc260',
    moodHex: '#ffd28a',
    treeFrames: [TOWN.TREE_GREEN_ROUND, TOWN.BUSH_GREEN, TOWN.TREE_ORANGE_1],
    label: 'verdant',
  },
  ike: {
    skyColor: '#5a6a48',
    moodHex: '#8a5a5a',
    treeFrames: [TOWN.TREE_ORANGE_1, TOWN.TREE_ORANGE_2, TOWN.BUSH_ORANGE],
    label: 'wilted',
  },
  lete: {
    skyColor: '#9dc7e6',
    moodHex: '#c0e0f0',
    treeFrames: [TOWN.TREE_GREEN_ROUND, TOWN.BUSH_GREEN_ALT, TOWN.BUSH_GREEN],
    label: 'frost-kissed',
  },
  seli: {
    skyColor: '#e69a5a',
    moodHex: '#ff9a60',
    treeFrames: [TOWN.TREE_ORANGE_1, TOWN.TREE_ORANGE_2, TOWN.BUSH_ORANGE],
    label: 'sun-baked',
  },
  pimeja: {
    skyColor: '#3d4a6b',
    moodHex: '#6a5a8a',
    treeFrames: [TOWN.TREE_GREEN_ROUND, TOWN.BUSH_GREEN, TOWN.BUSH_GREEN_ALT],
    label: 'dusk-dappled',
  },
  walo: {
    skyColor: '#d9e6c7',
    moodHex: '#f0ede0',
    treeFrames: [TOWN.TREE_GREEN_ROUND, TOWN.BUSH_GREEN, TOWN.BUSH_GREEN_ALT],
    label: 'pale',
  },
  suli: {
    skyColor: '#7aa85a',
    moodHex: '#d0e0a0',
    treeFrames: [TOWN.TREE_GREEN_ROUND, TOWN.TREE_ORANGE_1, TOWN.BUSH_GREEN],
    label: 'towering',
  },
  lili: {
    skyColor: '#95cf70',
    moodHex: '#c0f0a0',
    treeFrames: [TOWN.BUSH_GREEN, TOWN.BUSH_GREEN_ALT, TOWN.MUSHROOMS],
    label: 'diminutive',
  },
  wawa: {
    skyColor: '#8bc260',
    moodHex: '#e0d06a',
    treeFrames: [TOWN.TREE_ORANGE_1, TOWN.TREE_GREEN_ROUND, TOWN.BUSH_ORANGE],
    label: 'vibrant',
  },
  nasa: {
    skyColor: '#a890c7',
    moodHex: '#f0a0e0',
    treeFrames: [TOWN.MUSHROOMS, TOWN.TREE_ORANGE_1, TOWN.BUSH_GREEN_ALT],
    label: 'strange',
  },
};

/** Pick biome theme from the first adjective in the seed. Fallback: pona. */
export function biomeFromSeed(seed: Seed): BiomeTheme {
  return BIOME_THEMES[seed.adj1] ?? BIOME_THEMES['pona']!;
}

export interface VillagePlan {
  /** Place name, e.g. 'tomo ma pona' */
  nameTp: string;
  /** Biome visuals */
  biome: BiomeTheme;
  /** Deterministic house positions (slot → tx, ty). Always 3 slots. */
  slots: Array<{ tx: number; ty: number }>;
  /** Deterministic plaza center (shifts ±1 tile per seed) */
  plazaCenter: { tx: number; ty: number };
}

const DEFAULT_SLOTS: Array<{ tx: number; ty: number }> = [
  { tx: 9, ty: 6 },
  { tx: 17, ty: 6 },
  { tx: 13, ty: 11 },
];
const DEFAULT_PLAZA = { tx: 14, ty: 9 };

/** Name a village from its seed. Patterns vary by adjective category. */
export function nameFromSeed(seed: Seed): string {
  // Formula: 'tomo {noun} {adj1}' — 'house of <noun>, <adj>'
  return `tomo ${seed.noun} ${seed.adj1}`;
}

/** Build a deterministic village plan from a seed. */
export function planVillage(seed: Seed): VillagePlan {
  const rng = seedToRng(seed);
  // Small deterministic jitter on slot positions (±1 tile)
  const jitter = () => Math.floor(rng() * 3) - 1; // -1, 0, or 1
  const slots = DEFAULT_SLOTS.map(({ tx, ty }) => ({
    tx: tx + jitter(),
    ty: ty + jitter(),
  }));
  const plazaCenter = {
    tx: DEFAULT_PLAZA.tx + jitter(),
    ty: DEFAULT_PLAZA.ty + jitter(),
  };
  return {
    nameTp: nameFromSeed(seed),
    biome: biomeFromSeed(seed),
    slots,
    plazaCenter,
  };
}
