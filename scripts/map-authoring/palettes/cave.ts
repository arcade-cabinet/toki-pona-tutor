/**
 * Cave / peak-end palette from the Fan-tasy `fortress` pack.
 *
 * `w` uses a rock-slope tile with Tiled collision metadata so cave walls
 * behave as blockers instead of decorative floor paint.
 */
import type { Palette } from '../lib/types';
import { curatedTile } from '../config/art-curation';

export const cavePalette: Palette = {
  f: curatedTile('fan_tasy.fortress.floor.cave_plain', { description: 'plain cave floor' }),
  p: curatedTile('fan_tasy.fortress.floor.shrine_stone', { description: 'stone shrine floor' }),
  v: curatedTile('fan_tasy.fortress.floor.variation', { description: 'stone floor variation' }),
  w: curatedTile('fan_tasy.fortress.rock_slope.wall', { description: 'blocked cave wall' }),
  G: curatedTile('fan_tasy.fortress.castle_grass.cave_overgrowth', {
    description: 'cave encounter overgrowth',
  }),

  torch: curatedTile('fan_tasy.fortress.torch.floor', { description: 'animated cave torch' }),
  torch_wall: curatedTile('fan_tasy.fortress.torch.wall', { description: 'wall-mounted cave torch' }),
};
