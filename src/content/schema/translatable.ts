import { z } from "zod";

/**
 * A player-facing string authored directly in English.
 *
 * The optional `tp` field is accepted only for legacy generated saves/content
 * while the Rivers Reckoning pivot removes the old translation layer.
 */
export const translatable = z.object({
    en: z.string().min(1, "en required"),
    tp: z.string().optional(),
});
export type Translatable = z.infer<typeof translatable>;

/**
 * Same as `translatable` but constrained to a single display word. Use for
 * compact names, move keywords, type words, etc.
 */
export const translatableWord = z
    .object({
        en: z.string().regex(/^\S+$/, "single word required"),
        tp: z.string().optional(),
    })
    .describe("single display word");
export type TranslatableWord = z.infer<typeof translatableWord>;
