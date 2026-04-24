import { z } from "zod";
import { translatable } from "./translatable";
import { dialogBeat } from "./dialog";

/**
 * Region manifest — one per explorable map. Drives the region dossier
 * under `src/content/regions/<id>/region.json`.
 *
 * Pairs with per-region `npcs/*.json` (NPC dialog state files) and
 * `signs.json` (sign flavor copy). The build-spine compiler fans these
 * out into the flat `dialog` + new `signs` arrays consumed by the runtime.
 *
 * See docs/CONTENT_ARCHITECTURE.md for the full layout rationale.
 */
export const regionManifest = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    display_name: z.string(),
    biome: z.enum(["town", "forest", "peak", "ice", "cave", "water"]),
    music: z.string(),
    size: z.object({ w: z.number().int().positive(), h: z.number().int().positive() }),
    neighbors: z
        .object({
            north: z.string().optional(),
            south: z.string().optional(),
            east: z.string().optional(),
            west: z.string().optional(),
        })
        .default({}),
    summary: z.string(),
    flavor_beats: z.array(z.string()).default([]),
});
export type RegionManifest = z.infer<typeof regionManifest>;

/**
 * Gate clauses for dialog-state selection. A state matches when every
 * clause is true; first matching state wins in authored order.
 */
export const dialogStateGate = z
    .object({
        flag_present: z.string().optional(),
        flag_absent: z.string().optional(),
        // Future: quest stage gates, time-of-day, season, etc.
    })
    .default({});

/**
 * A single dialog state for one NPC. Multiple states live in one NPC
 * dossier file; the compiler expands each to a flat dialog record with
 * a synthesized id (`{npc_id}__{state_id}`).
 */
export const npcDialogState = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    when: dialogStateGate,
    priority: z.number().int().default(0),
    beats: z.array(dialogBeat).min(1),
    on_exit: z
        .object({
            set_flag: z.record(z.string(), z.boolean()).optional(),
            give_item: z
                .object({ item_id: z.string(), count: z.number().int().min(1) })
                .optional(),
            trigger: z.string().optional(),
        })
        .optional(),
});
export type NpcDialogState = z.infer<typeof npcDialogState>;

/**
 * One NPC dossier file. Replaces the per-line `spine/dialog/<line>.json`
 * flat layout: one file per character with all their dialog states
 * grouped by story-plateau.
 */
export const npcDossier = z.object({
    id: z.string().regex(/^[a-z][a-z0-9_]*$/),
    display_name: z.string(),
    home_region: z.string().regex(/^[a-z][a-z0-9_]*$/),
    role: z.string().optional(),
    portrait: z.string().optional(),
    appearances: z
        .array(
            z.object({
                region: z.string().regex(/^[a-z][a-z0-9_]*$/),
                spawn: z.tuple([z.number().int(), z.number().int()]).optional(),
                default: z.boolean().optional(),
                requires_flag: z.string().optional(),
            }),
        )
        .min(1),
    dialog_states: z.array(npcDialogState).min(1),
});
export type NpcDossier = z.infer<typeof npcDossier>;

/**
 * One sign record. Painted at (x, y) in tile coordinates; the runtime
 * shows the title + body in the dialog UI when the player walks onto
 * the sign tile or presses the action key adjacent to it.
 */
export const signRecord = z.object({
    at: z.tuple([z.number().int(), z.number().int()]),
    title: z.string().max(40),
    body: translatable,
});
export type SignRecord = z.infer<typeof signRecord>;

/**
 * Per-region sign file (`regions/<id>/signs.json`). A single file of
 * signs keyed to the region; bundled into world.json under a new
 * top-level `signs` array the runtime will consume.
 */
export const regionSigns = z.object({
    region: z.string().regex(/^[a-z][a-z0-9_]*$/),
    signs: z.array(signRecord).default([]),
});
export type RegionSigns = z.infer<typeof regionSigns>;
