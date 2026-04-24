import { getFlag, setFlag } from "../../platform/persistence/queries";
import { FINAL_BOSS_CONFIG } from "../../content/gameplay";

/**
 * Flag names dossier dialogue gates against that are DERIVED from other
 * progression state, not set directly by a single event. Exported from
 * one place so the list stays as narrow as possible.
 */
export const PROOFS_ALL_FOUR_FLAG = "proofs_all_four";

/**
 * Check whether every flag in `FINAL_BOSS_CONFIG.requiredBadgeFlags` is
 * currently truthy and, if so, set `proofs_all_four`. Called after every
 * badge write in gym-leader.ts so the derived flag fires at the exact
 * moment progression transitions, not on every map load.
 *
 * Idempotent: calling with the flag already set is a harmless re-arm.
 * Uses the same FINAL_BOSS_CONFIG list the green-dragon gate uses so
 * "all four proofs" semantics live in one place.
 *
 * The queries module is the single read/write layer so this helper
 * stays pure-logic-aware; tests can exercise it via the real persistence
 * layer (unit tests already boot the SQLite shim) or mock the two
 * dependencies.
 */
export async function maybeSetProofsAllFour(
    readFlag: (id: string) => Promise<string | null> = getFlag,
    writeFlag: (id: string, value: string) => Promise<void> = setFlag,
): Promise<boolean> {
    for (const flag of FINAL_BOSS_CONFIG.requiredBadgeFlags) {
        const value = await readFlag(flag);
        if (!value || value === "0") return false;
    }
    await writeFlag(PROOFS_ALL_FOUR_FLAG, "1");
    return true;
}
