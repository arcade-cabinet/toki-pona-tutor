/**
 * The single entry point for all compiled game content.
 *
 * `world.json` is emitted by `scripts/build-spine.mjs` from the spine files,
 * validated against the Zod schemas, and imported here as a frozen object.
 * Scenes, dialog, combat, and UI layers all pull from the accessors below
 * rather than touching the raw JSON so the shape stays one-way-coupled to
 * the schema.
 *
 * Region accessors (`getRegion`, `getRegions`, `getNpc`, `selectDialog`)
 * intentionally do not exist here. The new architecture (post region-schema
 * removal) treats Tiled `.tmx` files as the per-region authoring format and
 * the journey manifest as the arc through them. The L4 interaction layer
 * loads maps directly from `public/assets/maps/<map_id>.tmj`; per-NPC
 * dialog will load from `src/content/spine/dialog/<npc_id>.json` (L5).
 */
import worldJson from '../../content/generated/world.json';
import type { World, Species, Move, Item, Journey, JourneyBeat } from '../../content/schema';

const world = worldJson as unknown as World;

export function getWorld(): World {
  return world;
}

export function getJourney(): Journey {
  return world.journey;
}

export function getJourneyBeats(): JourneyBeat[] {
  return world.journey.beats;
}

export function getJourneyBeat(id: string): JourneyBeat | null {
  return world.journey.beats.find((b) => b.id === id) ?? null;
}

export function getJourneyBeatByMapId(mapId: string): JourneyBeat | null {
  return world.journey.beats.find((b) => b.map_id === mapId) ?? null;
}

export function getStartMapId(): string {
  return world.start_region_id || world.journey.beats[0]?.map_id || '';
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
