/**
 * Phaser asset + scene cache keys.
 *
 * Centralizing them here keeps Boot.ts (which preloads) and Main.ts
 * (which consumes) in agreement on string identifiers, so a typo in
 * one place can't silently fail to find an asset at runtime.
 */
const scene = {
  boot: 'boot',
  main: 'main',
  menu: 'menu',
} as const;

const tilemap = {
  ma_tomo_lili: 'ma_tomo_lili',
} as const;

const spritesheet = {
  playerIdle: 'player-idle',
  playerWalk: 'player-walk',
  playerSlash: 'player-slash',
} as const;

export const key = {
  scene,
  tilemap,
  spritesheet,
} as const;
