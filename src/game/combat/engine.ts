/**
 * Combat engine — pure logic, no UI.
 *
 * Pokemon-shape: the player's lead party member fights the wild creature
 * that spawned from a region's encounter table. Both sides have HP / moves
 * / types. Move damage = base_power * type_multiplier with a tiny level
 * scale. Catch mechanic uses a poki item; success scales with the wild
 * creature's remaining-HP ratio times its species.catch_rate times the
 * poki's `power`.
 */
import { getSpecies, getMove } from '../content/loader';
import { typeMultiplier } from '../../content/schema';
import type { PartyMember } from '../ecs/saveState';
import type { Species, Move } from '../../content/schema';

/** A live combatant (either the player's lead or the wild creature). */
export interface Combatant {
  species: Species;
  level: number;
  /** Current HP; starts at `max_hp`. */
  hp: number;
  max_hp: number;
  /** Known moves (resolved from species.learnset). At most 4. */
  moves: Move[];
  /** Parallel to moves: remaining PP per move. */
  pp: number[];
  /** True iff this combatant was freshly rolled (wild) — gates the catch
   *  button. False when it's the player's party member. */
  wild: boolean;
}

/** Build a combatant from a party member. Stats scaled by level. */
export function combatantFromParty(m: PartyMember): Combatant {
  const species = getSpecies(m.species_id);
  if (!species) throw new Error(`unknown species: ${m.species_id}`);
  const moves = m.moves
    .map((id) => getMove(id))
    .filter((mv): mv is Move => mv != null)
    .slice(0, 4);
  return {
    species,
    level: m.level,
    hp: m.hp,
    max_hp: m.max_hp,
    moves,
    pp: m.pp.slice(0, moves.length),
    wild: false,
  };
}

/** Build a combatant from a species id at a random level within a range. */
export function combatantFromWild(speciesId: string, level: number): Combatant | null {
  const species = getSpecies(speciesId);
  if (!species) return null;
  const stats = species.base_stats;
  const curveBonus = (level - 1) * 2;
  const maxHp = stats.hp + curveBonus;
  // Wild creatures know their learnset moves up to their level, capped at 4.
  const moves = species.learnset
    .filter((l) => l.level <= level)
    .map((l) => getMove(l.move_id))
    .filter((m): m is Move => m != null)
    .slice(-4);
  const pp = moves.map((m) => m.pp);
  return {
    species,
    level,
    hp: maxHp,
    max_hp: maxHp,
    moves,
    pp,
    wild: true,
  };
}

/** Damage formula — intentionally simple. Power × level factor × type
 *  multiplier, minus defender's defense. Clamped >= 1 on hit. */
export function computeDamage(move: Move, attacker: Combatant, defender: Combatant): number {
  const levelFactor = 1 + attacker.level * 0.1;
  const typeMult = typeMultiplier(move.type, defender.species.type);
  const raw = move.power * levelFactor * typeMult;
  // Defender's base "defense" stat smooths the curve; at base_stats.defense
  // ~40 we divide by 20 to keep damage in the 2-25 range for early levels.
  const defenseFactor = 1 + defender.species.base_stats.defense / 60;
  const dmg = Math.floor(raw / defenseFactor);
  return Math.max(1, dmg);
}

/** Pick the enemy AI's move: random from those with PP > 0. Returns null
 *  if the enemy has no usable moves (struggles — but our v1 doesn't model
 *  struggle, we just skip their turn). */
export function pickEnemyMove(c: Combatant): { move: Move; index: number } | null {
  const available: Array<{ move: Move; index: number }> = [];
  for (let i = 0; i < c.moves.length; i++) {
    if ((c.pp[i] ?? 0) > 0) available.push({ move: c.moves[i], index: i });
  }
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/** Catch-chance formula. Returns true on success. */
export function rollCatch(wild: Combatant, pokiPower = 1.0): boolean {
  if (!wild.wild) return false;
  const hpRatio = wild.hp / wild.max_hp;
  const base = wild.species.catch_rate;
  // The weaker the creature, the easier the catch. Squared curve so a
  // ~50%-HP target is ~25% of base rate, not 50%.
  const damageMult = Math.pow(1 - hpRatio, 2) + 0.15;
  const chance = Math.min(0.95, base * damageMult * pokiPower);
  return Math.random() < chance;
}

/** XP gained by beating a wild combatant — proportional to species.xp_yield
 *  and level. */
export function xpForVictory(defeated: Combatant): number {
  return defeated.species.xp_yield + defeated.level * 3;
}
