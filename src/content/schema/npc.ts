import { z } from "zod";
import { translatable } from "./translatable";

/**
 * An NPC placed in a region. Their dialog lives on the region, keyed by
 * `npc_id`; this schema defines the overworld placement and identity.
 *
 * `role` is a coarse tag the engine uses to render the right marker
 * (gold '!' over a quest-giver, blue '?' over someone you haven't met,
 * nothing over the sleepy elder).
 */
export const npcRole = z.enum([
    "starter_giver", // jan Sewi-style mentor
    "jan_lawa", // village master / gym leader
    "quest_giver",
    "ambient",
    "shopkeeper",
    "rival",
]);
export type NpcRole = z.infer<typeof npcRole>;

export const npc = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    /** Display name in TP (e.g. "jan Sewi"). These are names, not
     *  translatable strings — they pass through unchanged. */
    name_tp: z.string().min(1),
    /** English label shown above the sprite in the overworld. */
    name_en: z.string().min(1),
    role: npcRole,
    /** Short designer-facing description (never shown). */
    personality: z.string(),
    /** Tile coordinate within the region. */
    tile: z.object({ x: z.number().int(), y: z.number().int() }),
    /** Sprite frame in `dungeon_packed.png`. */
    sprite_frame: z.number().int().min(0).max(1024),
    /** Optional full-res portrait for dialog panels. */
    portrait_src: z.string().optional(),
    /** First-meeting greeting — a short single-beat line. Further dialog
     *  comes from the region's `dialog[]` keyed by this NPC's id. */
    greeting: z.object({
        text: translatable,
        mood: z.enum(["happy", "sad", "thinking", "excited"]).default("thinking"),
    }),
    /** jan-lawa NPCs have a roster of creatures and a gate the player must
     *  clear to pass. */
    team: z
        .array(
            z.object({
                species_id: z.string(),
                level: z.number().int().min(1).max(100),
                moves: z.array(z.string()).min(1),
            }),
        )
        .optional(),
    /** Short 1–3 word dictionary word the player earns by beating this
     *  jan-lawa (e.g. "telo"). Added to their lipu soweli + vocabulary. */
    reward_word: z.string().optional(),
});
export type Npc = z.infer<typeof npc>;
