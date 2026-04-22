import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
    MAP_METADATA,
    isMapBiome,
    isMapMusicTrack,
    mapMetadataFor,
} from '../../src/content/map-metadata';
import type { MapSpec, TmjProperty } from '../../scripts/map-authoring/lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const SPECS_DIR = join(ROOT, 'scripts/map-authoring/specs');
const MAPS_DIR = join(ROOT, 'public/assets/maps');
const TILED_DIR = join(ROOT, 'src/tiled');

function propValue(props: TmjProperty[] | undefined, name: string): unknown {
    return props?.find((p) => p.name === name)?.value;
}

function tmxHasProperty(tmx: string, name: string, value: string): boolean {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`<property\\s+name="${escapedName}"\\s+value="${escapedValue}"\\s*/>`).test(tmx);
}

async function loadSpecs(): Promise<MapSpec[]> {
    const files = readdirSync(SPECS_DIR).filter((file) => file.endsWith('.ts')).sort();
    const specs: MapSpec[] = [];
    for (const file of files) {
        const mod = (await import(pathToFileURL(join(SPECS_DIR, file)).href)) as { default?: MapSpec };
        if (mod.default) specs.push(mod.default);
    }
    return specs;
}

describe('map metadata contract', () => {
    it('has one runtime metadata entry per authored map spec', async () => {
        const specs = await loadSpecs();
        const specIds = specs.map((spec) => spec.id).sort();
        expect(Object.keys(MAP_METADATA).sort()).toEqual(specIds);
    });

    it('keeps spec biome/music_track aligned with the runtime registry', async () => {
        const specs = await loadSpecs();
        for (const spec of specs) {
            const metadata = mapMetadataFor(spec.id);
            expect(metadata, spec.id).not.toBeNull();
            expect(isMapBiome(spec.biome), spec.id).toBe(true);
            expect(isMapMusicTrack(spec.music_track), spec.id).toBe(true);
            expect({ biome: spec.biome, music_track: spec.music_track }).toEqual(metadata);
        }
    });

    it('persists biome and music_track in emitted TMJ and TMX artifacts', () => {
        for (const [mapId, metadata] of Object.entries(MAP_METADATA)) {
            const tmj = JSON.parse(
                readFileSync(join(MAPS_DIR, `${mapId}.tmj`), 'utf-8'),
            ) as { properties?: TmjProperty[] };
            const tmx = readFileSync(join(TILED_DIR, `${mapId}.tmx`), 'utf-8');

            expect(propValue(tmj.properties, 'biome'), mapId).toBe(metadata.biome);
            expect(propValue(tmj.properties, 'music_track'), mapId).toBe(metadata.music_track);
            expect(tmxHasProperty(tmx, 'biome', metadata.biome), mapId).toBe(true);
            expect(tmxHasProperty(tmx, 'music_track', metadata.music_track), mapId).toBe(true);
        }
    });
});
