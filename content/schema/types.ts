import { z } from 'zod';

/**
 * The elemental types creatures (and moves) belong to. Five at vertical
 * slice; expandable. Matchup table is defined in `typeChart`, not per-type,
 * so a new type can be added by extending the enum and the chart.
 */
export const typeId = z.enum([
  'seli', // fire
  'telo', // water
  'kasi', // plant
  'lete', // ice
  'wawa', // strong / physical
]);
export type TypeId = z.infer<typeof typeId>;

/**
 * Effectiveness multiplier a damaging move with type `attacker` deals to
 * a target of type `defender`. 2 = super effective, 0.5 = not very, 1 =
 * neutral. 0 = immune. Single-type per creature for v1.
 */
export const typeChart: Record<TypeId, Partial<Record<TypeId, number>>> = {
  seli: { kasi: 2, telo: 0.5, seli: 0.5 },
  telo: { seli: 2, kasi: 0.5, telo: 0.5 },
  kasi: { telo: 2, seli: 0.5, kasi: 0.5 },
  lete: { kasi: 2, seli: 0.5, lete: 0.5 },
  wawa: {},
};

export function typeMultiplier(attacker: TypeId, defender: TypeId): number {
  return typeChart[attacker][defender] ?? 1;
}
