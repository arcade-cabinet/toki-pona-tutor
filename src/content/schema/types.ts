import { z } from "zod";

/**
 * The elemental types creatures (and moves) belong to. Five at vertical
 * slice; expandable. Runtime matchup rules live in
 * `src/content/gameplay/combat.json`.
 */
export const typeId = z.enum([
    "seli", // fire
    "telo", // water
    "kasi", // plant
    "lete", // ice
    "wawa", // strong / physical
]);
export type TypeId = z.infer<typeof typeId>;
