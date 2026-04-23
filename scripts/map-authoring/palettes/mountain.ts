/**
 * Mountain-pass palette from the Fan-tasy `seasons` pack.
 *
 * The gray rock-slope entry intentionally carries Tiled collision data so
 * cliff cells block traversal instead of being decorative paint.
 */
import type { Palette } from '../lib/types';
import { curatedTile } from '../config/art-curation';
import { collectionAtlasEntry } from '../config/collection-atlases';

const seasonsTrees = 'seasons/Objects_Trees_Seasons';
const seasonsRocks = 'seasons/Objects_Rocks_Seasons';

export const mountainPalette: Palette = {
  g: curatedTile('fan_tasy.seasons.ground.grass_base', { description: 'highland grass' }),
  v: curatedTile('fan_tasy.seasons.ground.grass_dark', { description: 'dark highland grass' }),
  d: curatedTile('fan_tasy.seasons.road.dirt', { description: 'packed dirt mountain path' }),
  p: curatedTile('fan_tasy.seasons.road.stone', { description: 'stone peak path' }),
  G: curatedTile('fan_tasy.seasons.tall_grass.transparent_summer', {
    description: 'transparent highland encounter brush overlay',
  }),
  c: curatedTile('fan_tasy.seasons.rock_slope.gray_wall', { description: 'blocked gray cliff wall' }),

  tree_high: { ...collectionAtlasEntry(seasonsTrees, 113), description: 'birch highland tree' },
  tree_low: { ...collectionAtlasEntry(seasonsTrees, 0), description: 'emerald highland tree' },
  bush_high: { ...collectionAtlasEntry(seasonsTrees, 52), description: 'leafy highland bush' },
  rock_small: { ...collectionAtlasEntry(seasonsRocks, 20), description: 'small gray rock' },
  rock_tall: { ...collectionAtlasEntry(seasonsRocks, 42), description: 'tall gray rock' },
  rock_grass: { ...collectionAtlasEntry(seasonsRocks, 65), description: 'mossy gray rock' },
};
