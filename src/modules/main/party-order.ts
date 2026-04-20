/**
 * T2-12: party-order math.
 *
 * Pure array-transformation helpers the party-panel UI uses when
 * the player drags a creature to slot 0 (or moves between slots).
 * Callers persist the returned slot list to SQLite via queries.ts;
 * this module has no storage coupling so unit tests don't need a
 * DB and so the same logic works on web + Android + iOS.
 *
 * Input `PartySlot` is the minimal shape the panel cares about —
 * anything stored per-creature (xp, moves, status) rides along if
 * callers keep it on the slot.
 */

export type PartySlot = {
    species_id: string;
    level: number;
    [extra: string]: unknown;
};

/**
 * Move the slot at `from` to position 0, shifting earlier slots
 * down by one. All inputs returned unchanged on out-of-range
 * indices — the UI can't drag to a non-existent slot, so the
 * no-op branch is for safety, not expected use.
 */
export function promoteToLead<T extends PartySlot>(
    party: ReadonlyArray<T>,
    fromIndex: number,
): T[] {
    return reorderParty(party, fromIndex, 0);
}

/**
 * Move the slot at `from` to position `to`, with the rest of the
 * party shifting to fill the gap. Out-of-range `from` returns the
 * original array; `to` is clamped to [0, length - 1].
 *
 * This is move-semantics, not swap — the panel's drag UX is
 * "drop between slots," not "swap two slots."
 */
export function reorderParty<T extends PartySlot>(
    party: ReadonlyArray<T>,
    fromIndex: number,
    toIndex: number,
): T[] {
    const n = party.length;
    if (n <= 1) return party.slice();
    if (fromIndex < 0 || fromIndex >= n) return party.slice();
    const clampedTo = Math.max(0, Math.min(toIndex, n - 1));
    if (fromIndex === clampedTo) return party.slice();

    const next = party.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(clampedTo, 0, moved);
    return next;
}
