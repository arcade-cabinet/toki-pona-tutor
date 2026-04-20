import worldRaw from '../../content/generated/world.json';
import type { DialogNode } from '../../content/schema/dialog';
import type { Journey } from '../../content/schema/journey';

type Species = {
    id: string;
    learnset: { level: number; move_id: string }[];
};

/**
 * Narrow runtime type for the fields content.ts actually reads from world.json.
 * The full World shape lives in src/content/schema/world.ts — we import only
 * what we need here to keep the dependency surface tight.
 */
type ContentWorld = {
    dialog: DialogNode[];
    journey: Journey;
    start_region_id: string;
    species: Species[];
};

const world = worldRaw as unknown as ContentWorld;

export function getDialogById(id: string): DialogNode | undefined {
    return world.dialog.find((d) => d.id === id);
}

export function getStartMapId(): string {
    return world.start_region_id;
}

export function getJourneyBeats() {
    return world.journey.beats;
}

/**
 * Move IDs a species learns at a specific level (usually 0 or 1 per
 * creature per level). Used by the victory sequence to emit a
 * "learned X" toast when a level boundary matches a learnset entry.
 */
export function movesLearnedAtLevel(speciesId: string, level: number): string[] {
    const species = world.species.find((s) => s.id === speciesId);
    if (!species) return [];
    return species.learnset.filter((l) => l.level === level).map((l) => l.move_id);
}
