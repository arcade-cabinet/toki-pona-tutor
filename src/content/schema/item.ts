import { z } from "zod";
import { translatable } from "./translatable";

/**
 * An item the player can hold. Capture items catch creatures; potions restore HP;
 * gear equips to party creatures; key items gate nothing but unlock flavor/cosmetics.
 *
 * Per docs/ECONOMY.md § Item schema.
 * v2: "poki" → "capture_pod" + capture:true, "heal" → "potion", "flavor" dropped.
 */
export const itemKind = z.enum(["capture_pod", "potion", "gear", "material", "key"]);
export type ItemKind = z.infer<typeof itemKind>;

export const item = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    name: translatable,
    description: translatable,
    kind: itemKind,
    /** Log-scaled tier band 1-10. Used by loot table lookup. */
    tier: z.number().int().min(1).max(10),
    /** Base shop sell price in gold. */
    value: z.number().int().min(0).optional(),
    /** True for capture_pod items — usable in wild encounter catch phase. */
    capture: z.boolean().optional(),
    /** For potions: HP restored. For capture pods: base success-rate multiplier. */
    power: z.number().min(0).optional(),
    /** For gear: stat modifier bonuses. */
    stats: z
        .object({
            hp: z.number().optional(),
            atk: z.number().optional(),
            def: z.number().optional(),
            spd: z.number().optional(),
        })
        .optional(),
    /** Stackable in inventory? Key items are not. */
    stackable: z.boolean().default(true),
    sprite_frame: z.number().int().min(0).max(1024).optional(),
});
export type Item = z.infer<typeof item>;
