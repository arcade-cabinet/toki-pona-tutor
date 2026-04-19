import { trait } from 'koota';
import type { z } from 'zod';

/**
 * Turn a Zod schema into a Koota trait whose store shape matches the
 * schema's inferred TypeScript type. The `schema` argument is carried for
 * ergonomic type inference at call sites (`zodToKootaTrait(species, ...)`
 * returns a trait whose value has `species`'s inferred type). The actual
 * default value comes from the `fallback` argument — a sample that the
 * caller has already validated against the schema.
 *
 * Use this when a piece of spine content should also exist at runtime as
 * an ECS component — e.g. a Creature trait whose shape mirrors the
 * `species` schema, so a live party-member entity carries type-checked
 * state the engine can read and mutate.
 */
export function zodToKootaTrait<T extends z.ZodTypeAny>(
  _schema: T,
  fallback: z.infer<T>,
) {
  return trait<() => z.infer<T>>(() =>
    structuredClone(fallback as object) as z.infer<T>,
  );
}
