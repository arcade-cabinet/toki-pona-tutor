/**
 * Cave / peak-end palette from the Fan-tasy `fortress` pack.
 *
 * `w` uses a rock-slope tile with Tiled collision metadata so cave walls
 * behave as blockers instead of decorative floor paint.
 */
import type { Palette } from '../lib/types';

export const cavePalette: Palette = {
  f: { tsx: 'fortress/Castle_Floor', local_id: 14, description: 'plain cave floor' },
  p: { tsx: 'fortress/Castle_Floor', local_id: 158, description: 'stone shrine floor' },
  v: { tsx: 'fortress/Castle_Floor', local_id: 164, description: 'stone floor variation' },
  w: { tsx: 'fortress/Tileset_RockSlope', local_id: 194, description: 'blocked cave wall' },
  G: { tsx: 'fortress/Tileset_Castle_Grass', local_id: 2, description: 'cave encounter overgrowth' },

  torch: { tsx: 'fortress/Animation_Torch_1', local_id: 0, description: 'animated cave torch' },
  torch_wall: { tsx: 'fortress/Animation_Torch_1', local_id: 32, description: 'wall-mounted cave torch' },
};
