import { z } from "zod";
import { translatable } from "./translatable";

/**
 * A single dialog beat — one chunk of text, optionally with a compact clue
 * token for the journal. Multi-beat dialog is an array of these.
 */
export const dialogBeat = z.object({
    text: translatable,
    /** Optional clue token to record when the line is seen. */
    glyph: z.string().optional(),
    mood: z.enum(["happy", "sad", "thinking", "excited"]).default("thinking"),
});
export type DialogBeat = z.infer<typeof dialogBeat>;

/**
 * A dialog node — belongs to an NPC, activates when the quest stage /
 * flag conditions match, optionally triggers side-effects on close.
 *
 * Pull-style: the engine asks "what should this NPC say right now?" and
 * picks the first node whose conditions are satisfied.
 */
export const dialogNode = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    npc_id: z.string().nullable(),
    /** Quest-stage gate. Empty = always available. */
    when_quest: z.record(z.string(), z.string()).optional(),
    /** Named flag that must be true / false / unset. Used for things like
     *  `tutorial_complete: false`, `starter_chosen: true`. */
    when_flags: z.record(z.string(), z.boolean()).optional(),
    /** Priority within a matching pool — higher wins. Ambient flavor lines
     *  get priority 0; quest-critical lines get priority 10+. */
    priority: z.number().int().default(0),
    /** Beats to speak. Single-beat dialog is a one-entry array. */
    beats: z.array(dialogBeat).min(1),
    /** Side effects that fire when the dialog closes. */
    triggers: z
        .object({
            set_flag: z.record(z.string(), z.boolean()).optional(),
            advance_quest: z.object({ quest_id: z.string(), stage: z.string() }).optional(),
            give_item: z.object({ item_id: z.string(), count: z.number().int().min(1) }).optional(),
            add_party: z
                .object({ species_id: z.string(), level: z.number().int().min(1) })
                .optional(),
        })
        .optional(),
});
export type DialogNode = z.infer<typeof dialogNode>;
