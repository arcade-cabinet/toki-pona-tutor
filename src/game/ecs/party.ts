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
export function buildPartyMember(speciesId: string, level: number): PartyMember | null {
  const species = getSpecies(speciesId);
  if (!species) return null;
  const stats = species.base_stats;
  // Tiny stat curve: +2 per level per stat.
  const curveBonus = (level - 1) * 2;
  const maxHp = stats.hp + curveBonus;
  // Pick the first 4 moves whose unlock level the party-member meets.
  const moves = species.learnset
    .filter((l) => l.level <= level)
    .map((l) => l.move_id)
    .slice(-4);
  const pp = moves.map((mid) => getMove(mid)?.pp ?? 15);
  return {
    instance_id: `${speciesId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    species_id: speciesId,
    level,
    // Seed xp to match starting level so the first XP award moves the
    // member UP rather than dropping it via levelFromXp.
    xp: xpToReachLevel(level),
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
