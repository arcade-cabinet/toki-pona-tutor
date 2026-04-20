/**
 * Type matchup multipliers per ARCHITECTURE.md §Types.
 *
 *   seli (fire)  > kasi (plant)
 *   telo (water) > seli
 *   kasi         > telo
 *   lete (ice)   > waso-tagged species (flying)
 *   wawa (strong) — no advantage/disadvantage; high raw damage
 *
 * The classic 2×/0.5× rock-paper-scissors cycle lives on seli/telo/kasi.
 * `lete` is situational (flying-matchup only) and defaults to 0.5× against
 * non-waso since it has "weak offensive coverage otherwise." `wawa` is flat
 * 1.0× against everything — the bruiser type balanced by raw power, not
 * advantage.
 */

export type TpType = 'seli' | 'telo' | 'kasi' | 'lete' | 'wawa';

export const TP_TYPES: readonly TpType[] = ['seli', 'telo', 'kasi', 'lete', 'wawa'] as const;

/**
 * Look up the damage multiplier when a move of `attacker` type hits a
 * defender with primary type `defender` and (optionally) a flying tag.
 *
 * `defenderIsWaso` toggles the lete-vs-flying bonus independently of the
 * defender's primary type — some waso-tagged species are primarily wawa or
 * kasi but still take extra damage from ice.
 */
/**
 * @example
 * typeMultiplier('seli', 'kasi')  // → 2   (super-effective)
 * typeMultiplier('kasi', 'seli')  // → 0.5 (resisted)
 * typeMultiplier('seli', 'seli')  // → 1   (neutral same-type)
 * typeMultiplier('wawa', 'seli')  // → 1   (bruiser — flat)
 * typeMultiplier('lete', 'kasi', true)  // → 2 (ice vs waso-tagged)
 * typeMultiplier('lete', 'kasi', false) // → 0.5 (weak offensive)
 */
export function typeMultiplier(
    attacker: TpType,
    defender: TpType,
    defenderIsWaso = false,
): number {
    if (attacker === 'wawa') return 1;

    if (attacker === 'lete') {
        if (defenderIsWaso) return 2;
        return 0.5;
    }

    if (attacker === 'seli' && defender === 'kasi') return 2;
    if (attacker === 'telo' && defender === 'seli') return 2;
    if (attacker === 'kasi' && defender === 'telo') return 2;

    if (attacker === 'kasi' && defender === 'seli') return 0.5;
    if (attacker === 'seli' && defender === 'telo') return 0.5;
    if (attacker === 'telo' && defender === 'kasi') return 0.5;

    return 1;
}
