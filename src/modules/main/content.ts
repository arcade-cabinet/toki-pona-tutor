import worldRaw from '../../content/generated/world.json';

type DialogBeat = {
    text: { en: string; tp?: string };
    glyph?: string;
    mood?: 'happy' | 'sad' | 'thinking' | 'excited';
};

type DialogNode = {
    id: string;
    npc_id: string | null;
    when_flags?: Record<string, boolean>;
    priority: number;
    beats: DialogBeat[];
    triggers?: unknown;
};

type World = {
    dialog: DialogNode[];
    journey: { beats: Array<{ id: string; map_id: string }> };
    start_region_id: string;
};

const world = worldRaw as unknown as World;

export function getDialogById(id: string): DialogNode | undefined {
    return world.dialog.find((d) => d.id === id);
}

export function getStartMapId(): string {
    return world.start_region_id;
}

export function getJourneyBeats() {
    return world.journey.beats;
}
