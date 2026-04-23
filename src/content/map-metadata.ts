import {
    DEFAULT_RESPAWN as DEFAULT_RESPAWN_CONFIG,
    GAMEPLAY_MAPS,
    MAP_METADATA_CONFIG,
    type RuntimeMapMetadata,
} from "./gameplay";

export type MapBiome = RuntimeMapMetadata["biome"];

export type MapMusicTrack = RuntimeMapMetadata["music_track"];

export interface MapMetadata {
    biome: MapBiome;
    music_track: MapMusicTrack;
}

export const MAP_METADATA = MAP_METADATA_CONFIG as Record<string, MapMetadata>;
export const MAP_BIOMES = uniqueValues(Object.values(MAP_METADATA).map((map) => map.biome));
export const MAP_MUSIC_TRACKS = uniqueValues(
    Object.values(MAP_METADATA).map((map) => map.music_track),
);

export type KnownMapId = keyof typeof MAP_METADATA;

export function isMapBiome(value: string): value is MapBiome {
    return (MAP_BIOMES as readonly string[]).includes(value);
}

export function isMapMusicTrack(value: string): value is MapMusicTrack {
    return (MAP_MUSIC_TRACKS as readonly string[]).includes(value);
}

export function mapMetadataFor(mapId: string): MapMetadata | null {
    return MAP_METADATA[mapId as KnownMapId] ?? null;
}

export function mapLabelFor(mapId: string): string {
    return GAMEPLAY_MAPS[mapId]?.label ?? mapId.replace(/_/g, " ");
}

export function safeSpawnFor(mapId: string): { x: number; y: number } | null {
    return GAMEPLAY_MAPS[mapId]?.safe_spawn ?? null;
}

export function defaultRespawnPoint(): { mapId: string; x: number; y: number } {
    return {
        mapId: DEFAULT_RESPAWN_CONFIG.map_id,
        x: DEFAULT_RESPAWN_CONFIG.x,
        y: DEFAULT_RESPAWN_CONFIG.y,
    };
}

function uniqueValues<T extends string>(values: T[]): readonly T[] {
    return [...new Set(values)].sort();
}
