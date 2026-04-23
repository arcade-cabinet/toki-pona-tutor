import { z } from "zod";
import { translatable } from "./translatable";

/**
 * An item the player can hold. Capture tools catch creatures; healing items
 * restore HP; key items unlock world progression beats.
 */
export const itemKind = z.enum(["poki", "heal", "key", "flavor"]);
export type ItemKind = z.infer<typeof itemKind>;

export const item = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    name: translatable,
    description: translatable,
    kind: itemKind,
    /** For poki: base success rate multiplier (0.5 — flimsy, 1.0 — standard,
     *  1.5 — reinforced). For heal: HP restored. Ignored for key/flavor. */
    power: z.number().min(0).optional(),
    /** Stackable in inventory? Key items are not. */
    stackable: z.boolean().default(true),
    sprite_frame: z.number().int().min(0).max(1024).optional(),
});
export type Item = z.infer<typeof item>;
