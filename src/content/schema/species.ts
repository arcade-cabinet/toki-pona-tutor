import { z } from 'zod';
import { translatable, translatableWord } from './translatable';
import { typeId } from './types';

/**
 * Base stats a creature is born with. Level-up scales these by a curve
 * defined in the combat engine. Raw values are roughly in the genre-
 * typical 30–120 range for level 1.
 */
export const baseStats = z.object({
  hp: z.number().int().min(1).max(250),
  attack: z.number().int().min(1).max(250),
  defense: z.number().int().min(1).max(250),
  speed: z.number().int().min(1).max(250),
});
export type BaseStats = z.infer<typeof baseStats>;

/**
 * A named animation strip within a sprite sheet. Each strip occupies
 * one contiguous range of cells — typically one row (`row` = Y index,
 * `cols` = how many frames across). Frame size is fixed per sheet.
 */
export const animationStrip = z.object({
  /** Row index (0-based, top row = 0). */
  row: z.number().int().min(0).max(63),
  /** First column of the strip (0-based, leftmost = 0). */
  col_start: z.number().int().min(0).max(63).default(0),
  /** Number of frames in the strip, reading L→R from col_start. */
  cols: z.number().int().min(1).max(128),
  /** Frames per second; 8-12 for walking, 4-6 for idle. */
  fps: z.number().int().min(1).max(60).default(8),
  /** Whether this animation loops. Idle/walk=true, attack/death=false. */
  loop: z.boolean().default(true),
});
export type AnimationStrip = z.infer<typeof animationStrip>;

/**
 * Sprite sheet reference for a creature. Every species asset in the
 * game is a sheet. Curated species declare the sheet's grid (frame
 * size in px) and one or more named animation strips. The runtime
 * slices and plays them on the player's lead creature + the enemy.
 *
 * An animation is addressed as `sprite.animations[<name>]`, e.g.
 * `sprite.animations.idle`, `sprite.animations.walk`. Minimum viable
 * set for any creature: `idle`. Recommended: `idle`, `walk`, `attack`.
 * Bosses + legendaries typically also carry `death`.
 */
export const sprite = z.object({
  /** Path under /public, served as /assets/<...>.png. */
  src: z.string().regex(/^\/assets\//, 'sprite src must start with /assets/'),
  /** Pixel width of a single frame. */
  frame_width: z.number().int().min(8).max(512),
  /** Pixel height of a single frame. */
  frame_height: z.number().int().min(8).max(512),
  /** Named animation strips. The engine picks `idle` by default. */
  animations: z.record(z.string(), animationStrip),
  /** Tier hint used by the encounter engine: common=random grass roll,
   *  uncommon=rarer + higher level band, legendary=set-piece + rare. */
  tier: z.enum(['common', 'uncommon', 'legendary']).default('common'),
});
export type Sprite = z.infer<typeof sprite>;

/**
 * A creature species — the lipu soweli entry.
 *
 * Every species is catchable. Tier differentiates rarity + animation
 * depth, not whether the poki works. Bosses are harder catches with
 * richer animation; the green dragon is the legendary final catch.
 */
export const species = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  /** Canonical TP name — must be a dictionary word. */
  name: translatableWord,
  /** One-sentence lipu soweli flavor. Must round-trip through Tatoeba. */
  description: translatable,
  type: typeId,
  base_stats: baseStats,
  /** Learnset — moves the creature knows at or below its current level.
   *  Level 1 moves are known from the start. */
  learnset: z.array(z.object({ level: z.number().int().min(1).max(100), move_id: z.string() })),
  /** Probability of a successful capture when thrown-at at full HP. Real
   *  success is scaled by remaining-HP ratio: the weaker the target, the
   *  more likely it's caught. Range: 0.05 (legendary) to 0.48 (common). */
  catch_rate: z.number().min(0.01).max(0.95).default(0.25),
  /** XP given to the victor when this species is beaten. */
  xp_yield: z.number().int().min(1).max(500).default(30),
  /** Legacy: single-frame index into an old packed sheet. Optional;
   *  superseded by `sprite` on curated species. */
  sprite_frame: z.number().int().min(0).max(1024).optional(),
  /** Legacy: path to a single-image portrait. Optional; superseded by
   *  `sprite` on curated species. */
  portrait_src: z.string().optional(),
  /** Curated sprite sheet descriptor. Species with a `sprite` block are
   *  the ones whose sheet has been hand-inspected for frame layout +
   *  named animation strips. Species without `sprite` still work via
   *  legacy fields but can't animate properly until curated. */
  sprite: sprite.optional(),
});
export type Species = z.infer<typeof species>;
