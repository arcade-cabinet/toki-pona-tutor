/**
 * The single entry point for all compiled game content.
 *
 * `world.json` is emitted by `scripts/build-spine.mjs` from the spine files,
 * validated against the Zod schemas, and imported here as a frozen object.
 * Scenes, dialog, combat, and UI layers all pull from the accessors below
 * rather than touching the raw JSON so the shape stays one-way-coupled to
 * the schema.
 */
import worldJson from '../../content/generated/world.json';
import type { World, Region, Species, Move, Item, Npc, DialogNode } from '../../content/schema';

const world = worldJson as unknown as World;

export function getWorld(): World {
  return world;
}

export function getRegion(id: string): Region | null {
  return world.regions.find((r) => r.id === id) ?? null;
}

export function getRegions(): Region[] {
  return world.regions;
}

export function getStartRegionId(): string {
  return world.start_region_id || world.regions[0]?.id || '';
}

export function getSpecies(id: string): Species | null {
  return world.species.find((s) => s.id === id) ?? null;
}

export function getAllSpecies(): Species[] {
  return world.species;
}

export function getMove(id: string): Move | null {
  return world.moves.find((m) => m.id === id) ?? null;
}

export function getAllMoves(): Move[] {
  return world.moves;
}

export function getItem(id: string): Item | null {
  return world.items.find((i) => i.id === id) ?? null;
}

export function getNpc(regionId: string, npcId: string): Npc | null {
  const region = getRegion(regionId);
  if (!region) return null;
  return region.npcs.find((n) => n.id === npcId) ?? null;
}

/**
 * Select the best-matching dialog node for an NPC given the current flag
 * and quest state. Higher priority wins when multiple nodes match. Returns
 * null if nothing matches.
 */
export function selectDialog(
  regionId: string,
  npcId: string,
  flags: Record<string, boolean>,
  quests: Record<string, string>,
): DialogNode | null {
  const region = getRegion(regionId);
  if (!region) return null;

  const matches = region.dialog.filter((d) => {
    if (d.npc_id !== npcId) return false;
    if (d.when_flags) {
      for (const [key, expected] of Object.entries(d.when_flags)) {
        const actual = flags[key] ?? false;
        if (actual !== expected) return false;
      }
    }
    if (d.when_quest) {
      for (const [questId, expectedStage] of Object.entries(d.when_quest)) {
        if ((quests[questId] ?? '') !== expectedStage) return false;
      }
    }
    return true;
  });

  if (matches.length === 0) return null;
  // priority is defaulted to 0 by the Zod schema, but guard here too in case
  // generated/world.json was produced by an older build.
  matches.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return matches[0];
}
