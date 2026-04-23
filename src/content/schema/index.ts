/**
 * Content schema — the source of truth for Rivers Reckoning's declarative
 * content. Spine files in `src/content/spine/` are validated against these
 * schemas at build time, then compiled into `src/content/generated/world.json`.
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
