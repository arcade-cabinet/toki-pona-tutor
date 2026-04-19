import { z } from 'zod';
import { translatable, translatableWord } from './translatable';
import { typeId } from './types';

/**
 * A combat move. Moves are attached to species via their learnset. Damage
 * and accuracy are base stats; creature level scales them at runtime.
 *
 * Effect hooks are open-ended — `special` carries a string key that the
 * combat engine resolves (`"flinch"`, `"heal_self_25"`, etc.). Unknown
 * keys fail the schema so we never ship an unrecognized effect.
 */
export const moveEffect = z.enum([
  'none',
  'flinch',
  'heal_self_25',
  'raise_attack',
  'lower_defense',
  'poison',
]);
export type MoveEffect = z.infer<typeof moveEffect>;

export const move = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  /** Canonical TP verb (e.g. "utala", "pona"). Authored in English; the
   *  build step looks up its short EN gloss via Tatoeba if missing. */
  name: translatableWord,
  /** Player-facing description. Must round-trip through Tatoeba. */
  description: translatable,
  type: typeId,
  power: z.number().int().min(0).max(250),
  accuracy: z.number().int().min(0).max(100).default(100),
  pp: z.number().int().min(1).max(40).default(15),
  effect: moveEffect.default('none'),
  /** Priority bracket — higher goes first in a turn. Default 0; quick moves
   *  use +1, slow moves -1. */
  priority: z.number().int().min(-6).max(6).default(0),
});
export type Move = z.infer<typeof move>;
