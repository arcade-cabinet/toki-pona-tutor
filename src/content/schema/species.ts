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
 * A creature species — the lipu soweli entry.
 *
 * `sprite_frame` / `portrait_src` are legacy fields from the pre-Fan-tasy
 * asset pipeline; new regions should reference sprites under
 * public/assets/creatures/ or bosses/ by path, not frame index.
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
   *  more likely it's caught. Range: 0.05 (legendary) to 0.45 (common). */
  catch_rate: z.number().min(0.01).max(0.95).default(0.25),
  /** XP given to the victor when this species is beaten. */
  xp_yield: z.number().int().min(1).max(500).default(30),
  /** Sprite frame in `dungeon_packed.png` for the overworld / in-grass
   *  cameo. */
  sprite_frame: z.number().int().min(0).max(1024),
  /** Full-res portrait asset path served from /public. Optional; the
   *  engine falls back to the sprite frame if absent. */
  portrait_src: z.string().optional(),
});
export type Species = z.infer<typeof species>;
