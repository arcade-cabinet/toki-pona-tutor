import { z } from "zod";

/**
 * A translatable string — authored as English, filled with canonical Toki
 * Pona at build time. Authors write `{ en: "..." }`; the build step resolves
 * `tp` from the Tatoeba corpus. After `scripts/build-spine.mjs` runs, both
 * fields are present. Before it runs, only `en` is guaranteed.
 *
 * Validators accept both shapes (post-translation and pre-translation) so
 * the same Zod schema vets authored spine files and generated output.
 */
export const translatable = z.object({
    en: z.string().min(1, "en required"),
    tp: z.string().optional(),
});
export type Translatable = z.infer<typeof translatable>;

/**
 * Same as `translatable` but the source English must be a single dictionary
 * word (no spaces). These bypass Tatoeba validation — the word dictionary
 * is already vetted. Use for names, move keywords, type words, etc.
 */
export const translatableWord = z
    .object({
        en: z.string().regex(/^\S+$/, "single word required"),
        tp: z.string().optional(),
    })
    .describe("single word — exempt from Tatoeba validation");
export type TranslatableWord = z.infer<typeof translatableWord>;
