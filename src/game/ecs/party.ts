/**
 * Party-state helpers — pure functions over save state.
 *
 * Lifted out of the (deleted) RegionScene so dialog overlays can call
 * `giftToParty` without depending on a scene module. Materializes a
 * PartyMember from a species id + level by consulting compiled species
 * data and the XP curve in saveState.
 */
import { addToParty, xpToReachLevel, type PartyMember } from './saveState';
import { getSpecies, getMove } from '../content/loader';

/**
 * Materialize a PartyMember from a species id + level. Returns null if
 * the species is not in the compiled world (likely a content typo).
 */
/**
 * Hard clamp so dialog-trigger typos / underflow / fractional levels
 * never produce broken party state. `xpToReachLevel` already implicitly
 * clamps internally; this keeps the rest of the derivation (curveBonus,
 * maxHp, learnset filtering) consistent with the value we persist.
 */
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;

export function buildPartyMember(speciesId: string, level: number): PartyMember | null {
  const species = getSpecies(speciesId);
  if (!species) return null;
  const lvl = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.floor(level)));
  const stats = species.base_stats;
  // Tiny stat curve: +2 per level per stat.
  const curveBonus = (lvl - 1) * 2;
  const maxHp = Math.max(1, stats.hp + curveBonus);
  // Pick the last 4 moves whose unlock level the party-member meets
  // (i.e. the most-recently-learned). `.slice(-4)` after the level
  // filter naturally trims older moves once the learnset grows past 4.
  const moves = species.learnset
    .filter((l) => l.level <= lvl)
    .map((l) => l.move_id)
    .slice(-4);
  const pp = moves.map((mid) => getMove(mid)?.pp ?? 15);
  return {
    instance_id: `${speciesId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    species_id: speciesId,
    level: lvl,
    // Seed xp to match starting level so the first XP award moves the
    // member UP rather than dropping it via levelFromXp.
    xp: xpToReachLevel(lvl),
    hp: maxHp,
    max_hp: maxHp,
    moves,
    pp,
  };
}

/**
 * Install a new party member from a dialog `add_party` trigger.
 * Returns true on success, false if the species lookup failed or the
 * party is already full.
 */
export function giftToParty(speciesId: string, level: number): boolean {
  const member = buildPartyMember(speciesId, level);
  if (!member) return false;
  return addToParty(member);
}
