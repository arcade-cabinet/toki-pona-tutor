/**
 * Persistence-layer constants shared across save-strategy, queries, and
 * the player hooks. Centralized so a change to (e.g.) slot layout or
 * party cap doesn't need a grep across three modules.
 */

/** Slot index the engine autosaves into. Manual saves live at 1, 2, 3. */
export const AUTOSAVE_SLOT = 0;

/** Max creatures the player can carry in their active party. */
export const PARTY_SIZE_MAX = 6;

/** Manual save slot indices offered by the pause-menu save UI. */
export const MANUAL_SAVE_SLOTS = [1, 2, 3] as const;
export type ManualSaveSlot = (typeof MANUAL_SAVE_SLOTS)[number];
