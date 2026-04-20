import worldRaw from '../../content/generated/world.json';
import type { DialogNode } from '../../content/schema/dialog';
import type { Journey } from '../../content/schema/journey';

/**
 * Narrow runtime type for the fields content.ts actually reads from world.json.
 * The full World shape lives in src/content/schema/world.ts — we import only
 * what we need here to keep the dependency surface tight.
 */
type ContentWorld = {
    dialog: DialogNode[];
    journey: Journey;
    start_region_id: string;
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
