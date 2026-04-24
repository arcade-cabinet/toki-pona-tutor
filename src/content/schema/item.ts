import { z } from "zod";
import { translatable } from "./translatable";

/**
 * An item the player can hold. Capture tools (items with `capture: true`)
 * catch creatures; healing items restore HP; key items unlock world
 * progression beats. The boolean `capture` flag replaces the previous
 * `kind` enum, which had exactly one meaningful value.
 */
export const item = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    name: translatable,
    description: translatable,
    /** True when the item is a capture tool (rolled against in wild catch). */
    capture: z.boolean().optional(),
    /** For capture tools: base success rate multiplier (0.5 — flimsy, 1.0 —
     *  standard, 1.5 — reinforced). For heal: HP restored. */
    power: z.number().min(0).optional(),
    /** Stackable in inventory? Key items are not. */
    stackable: z.boolean().default(true),
    sprite_frame: z.number().int().min(0).max(1024).optional(),
});
export type Item = z.infer<typeof item>;
