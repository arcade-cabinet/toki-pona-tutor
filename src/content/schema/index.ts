/**
 * Content schema — the source of truth for Toki Town's declarative content.
 *
 * Every game object — species, move, region, NPC, dialog node, item, world —
 * is defined here as a Zod schema. Spine files in `src/content/spine/` are
 * validated against these schemas at build time; the generated
 * `src/content/generated/world.json` is their compiled shape with Toki Pona
 * strings filled from the Tatoeba corpus.
 *
 * Hand-authored TP is banned. Every multi-word TP field must round-trip
 * through Tatoeba. Single-word TP (entries from the dictionary) is exempt.
 */
export * from "./translatable";
export * from "./types";
export * from "./move";
export * from "./species";
export * from "./item";
export * from "./npc";
export * from "./dialog";
export * from "./journey";
export * from "./world";
