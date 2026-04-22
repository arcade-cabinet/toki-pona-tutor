import { z } from "zod";

/**
 * The journey manifest — the player's ordered arc through the seven regions.
 *
 * The journey is the spine of the game. You read it top-to-bottom and
 * understand the whole arc. Maps (Tiled `.tmx` files under
 * `public/assets/maps/<map_id>.tmj`) are atomic; the journey describes the
 * traversal between them — what unlocks the next beat (a `gate`) and how the
 * scene transitions there (a `transition`).
 *
 * The L4 interaction layer reads this manifest at scene boot and uses it to
 * (1) know which map to load, (2) know what gate the player must satisfy
 * before progression objects activate, and (3) know which Tiled object
 * (warp / dialog id / scripted_combat / cutscene) fires the cut to the next
 * beat. See `docs/JOURNEY.md` for the prose source and
 * `src/content/spine/journey.json` for the materialized arc.
 *
 * `narrative` is dev-facing only — it is NOT a translatable string and does
 * NOT round-trip through the Tatoeba corpus. The player never sees it.
 */

const beatId = z.string().regex(/^[a-z][a-z0-9_]*$/, "beat id must be lower-snake-case");

/**
 * A `gate` describes what the player must do in the current beat before the
 * transition to the next beat is allowed to fire. The L4 layer evaluates
 * gates against save state and either hides the transition trigger or marks
 * it inert until the gate clears.
 */
export const journeyGate = z.discriminatedUnion("kind", [
    /** Player must have picked a starter creature (sets the `starter_chosen`
     *  save flag). Used in `ma_tomo_lili`. */
    z.object({
        kind: z.literal("starter_chosen"),
    }),
    /** Player must have caught at least `count` distinct species in this beat
     *  before progression. Useful in catching-focused beats; not currently
     *  used in the canonical seven-region arc but reserved for future tuning. */
    z.object({
        kind: z.literal("catch_count"),
        count: z.number().int().min(1).max(20),
    }),
    /** Player must have defeated a specific NPC (set-piece combat). The
     *  `npc_id` matches the NPC defined in the corresponding region's spine
     *  data (and, when L4 lands, in the Tiled map's NPC object). */
    z.object({
        kind: z.literal("defeated"),
        npc_id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    }),
    /** Player must have a named save flag set. Reserved for cross-cutting
     *  conditions like `badges_all_four` (the endgame gate). */
    z.object({
        kind: z.literal("flag"),
        flag_id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    }),
]);
export type JourneyGate = z.infer<typeof journeyGate>;

/**
 * A `transition` describes how the cut from this beat to the next is
 * triggered — which kind of in-world object fires it, and (when applicable)
 * the name of that object as it appears in the Tiled map's object layer.
 */
export const journeyTransition = z.discriminatedUnion("kind", [
    /** A `Warp` object on the map whose `name` matches `trigger_object`. The
     *  player walks onto it and the next beat's map loads. The most common
     *  inter-region cut. */
    z.object({
        kind: z.literal("warp"),
        trigger_object: z.string().min(1),
    }),
    /** Closing a specific dialog node fires the cut. `trigger_object` here is
     *  the dialog node id the L4 layer watches for. */
    z.object({
        kind: z.literal("dialog"),
        trigger_object: z.string().min(1),
    }),
    /** Winning a specific scripted combat fires the cut. `trigger_object` is
     *  the NPC id whose set-piece fight closes the beat. */
    z.object({
        kind: z.literal("combat"),
        trigger_object: z.string().min(1),
    }),
    /** A scripted cutscene closes the beat. The endgame green-dragon hand-off
     *  uses this kind. `trigger_object` is the Tiled object name that arms
     *  the cutscene. */
    z.object({
        kind: z.literal("cutscene"),
        trigger_object: z.string().min(1),
    }),
]);
export type JourneyTransition = z.infer<typeof journeyTransition>;

export const journeyBeat = z.object({
    /** Stable ordinal id of this beat. Convention: `beat_<NN>_<region>`. */
    id: beatId,
    /** Region (and Tiled map) this beat plays out in. Matches both the region
     *  spine id and the eventual `public/assets/maps/<map_id>.tmj` filename. */
    map_id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    /** Dev-facing prose describing what happens in this beat. Mirrors the
     *  matching section in `docs/JOURNEY.md`. NOT shown to the player; NOT
     *  Tatoeba-validated. Keep it under ~200 words (~1 500 chars). */
    narrative: z.string().min(20).max(1500),
    /** What the player must do here before the next beat is reachable.
     *  Optional — beats without a gate are pass-through (currently none in
     *  the canonical arc). */
    gate: journeyGate.optional(),
    /** How the cut to the next beat fires. The last beat in the arc has a
     *  `cutscene` transition that hands off to the endgame; non-final beats
     *  use `warp` for the typical region-to-region edge. Required — a beat
     *  without a transition would soft-lock progression. */
    transition: journeyTransition,
});
export type JourneyBeat = z.infer<typeof journeyBeat>;

export const journey = z.object({
    /** Ordered list of beats. The first beat is where a fresh save starts
     *  the player; the last beat is the endgame approach. The L4 layer
     *  walks this list and uses (beat.map_id, beat.gate, beat.transition)
     *  to drive scene loading + progression. */
    beats: z.array(journeyBeat).min(1),
});
export type Journey = z.infer<typeof journey>;
