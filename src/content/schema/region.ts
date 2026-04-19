import { z } from 'zod';
import { translatable } from './translatable';
import { npc } from './npc';
import { dialogNode } from './dialog';

/**
 * A region = one Phaser scene's worth of world. Villages, routes, caves are
 * all regions. Region files live in `src/content/spine/regions/<id>.json`.
 *
 * The tile layer is a 2D array of tile keys; the engine maps each key to a
 * frame in the Kenney tilemap via a small lookup table. Multiple layers
 * (ground, objects, overlay) compose into the final scene.
 *
 * Encounter table rolls on tiles tagged `tall-grass` in the meta layer.
 */
export const tileLayer = z.object({
  /** `ground`, `objects`, `overlay`. */
  name: z.string(),
  /** 2D grid of tile keys. Empty cells are `null`. */
  tiles: z.array(z.array(z.string().nullable())),
  /** Which tile keys in this layer act as colliders. */
  solid_keys: z.array(z.string()).default([]),
  depth: z.number().int().default(0),
});
export type TileLayer = z.infer<typeof tileLayer>;

/**
 * An encounter table entry — a species this region can spawn and its
 * weight in the weighted roll.
 */
export const encounter = z.object({
  species_id: z.string(),
  weight: z.number().min(0).max(100),
  min_level: z.number().int().min(1).max(100),
  max_level: z.number().int().min(1).max(100),
});
export type Encounter = z.infer<typeof encounter>;

export const warp = z.object({
  id: z.string(),
  /** Tile in the source region. Entering it transitions to `to_region`. */
  tile: z.object({ x: z.number().int(), y: z.number().int() }),
  to_region: z.string(),
  to_tile: z.object({ x: z.number().int(), y: z.number().int() }),
});
export type Warp = z.infer<typeof warp>;

export const sign = z.object({
  id: z.string(),
  tile: z.object({ x: z.number().int(), y: z.number().int() }),
  text: translatable,
});
export type Sign = z.infer<typeof sign>;

export const region = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  /** Display name. */
  name_tp: z.string().min(1),
  name_en: z.string().min(1),
  /** Short flavor — shown in a toast when the player enters. */
  description: translatable,
  /** Grid dimensions. Layers must match. */
  width: z.number().int().min(8).max(128),
  height: z.number().int().min(8).max(128),
  /** Background color painted behind the tile layers (CSS hex). */
  sky_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  layers: z.array(tileLayer).min(1),
  /** Tile keys that are tall-grass — the encounter roll fires when the
   *  player steps on any of these. */
  tall_grass_keys: z.array(z.string()).default([]),
  encounters: z.array(encounter).default([]),
  npcs: z.array(npc).default([]),
  signs: z.array(sign).default([]),
  warps: z.array(warp).default([]),
  dialog: z.array(dialogNode).default([]),
  /** Player spawn-in point when warping here via id. */
  spawn: z.object({ x: z.number().int(), y: z.number().int() }),
});
export type Region = z.infer<typeof region>;
