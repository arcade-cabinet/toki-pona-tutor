import { z } from "zod";

/**
 * The elemental types creatures (and moves) belong to. Five at vertical
 * slice; expandable. Runtime matchup rules live in
 * `src/content/gameplay/combat.json`.
 */
export const typeId = z.enum([
    "fire",
    "water",
    "grass",
    "frost",
    "stone",
]);
export type TypeId = z.infer<typeof typeId>;
