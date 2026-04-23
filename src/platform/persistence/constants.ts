import { GAME_RULES_CONFIG } from "../../content/gameplay";

/** Slot index the engine autosaves into. Manual saves are JSON-configured. */
export const AUTOSAVE_SLOT = GAME_RULES_CONFIG.autosaveSlot;

/** Max creatures the player can carry in their active party. */
export const PARTY_SIZE_MAX = GAME_RULES_CONFIG.partySizeMax;

/** Manual save slot indices offered by the pause-menu save UI. */
export const MANUAL_SAVE_SLOTS = GAME_RULES_CONFIG.manualSaveSlots;
export type ManualSaveSlot = (typeof MANUAL_SAVE_SLOTS)[number];
