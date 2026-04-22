import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import maTomoLili from '../../scripts/map-authoring/specs/ma_tomo_lili';
import nasinWan from '../../scripts/map-authoring/specs/nasin_wan';
import nasinPiTelo from '../../scripts/map-authoring/specs/nasin_pi_telo';
import maTelo from '../../scripts/map-authoring/specs/ma_telo';
import maLete from '../../scripts/map-authoring/specs/ma_lete';
import nenaSewi from '../../scripts/map-authoring/specs/nena_sewi';
import nenaSuli from '../../scripts/map-authoring/specs/nena_suli';
import { cavePalette } from '../../scripts/map-authoring/palettes/cave';
import { icePalette } from '../../scripts/map-authoring/palettes/ice';
import { mountainPalette } from '../../scripts/map-authoring/palettes/mountain';
import { waterPalette } from '../../scripts/map-authoring/palettes/water';
import type { PlacedTile, TileGrid } from '../../scripts/map-authoring/lib/types';

const SHIPPED_SPECS = [
    ['ma_tomo_lili', maTomoLili],
    ['nasin_wan', nasinWan],
    ['nena_sewi', nenaSewi],
    ['ma_telo', maTelo],
    ['ma_lete', maLete],
    ['nena_suli', nenaSuli],
    ['nasin_pi_telo', nasinPiTelo],
] as const;

function isTileGrid(layer: TileGrid | PlacedTile[] | undefined): layer is TileGrid {
    return Array.isArray(layer) && layer.length > 0 && Array.isArray(layer[0]);
}

function npcNames(spec: { layers: { Objects?: Array<{ type: string; name: string }> } }): string[] {
    return (spec.layers.Objects ?? [])
        .filter((marker) => marker.type === 'NPC')
        .map((marker) => marker.name)
        .sort();
}

function dialogNodesById(): Map<string, { id: string; npc_id: string | null; beats: unknown[] }> {
    const dir = resolve(__dirname, '../../src/content/spine/dialog');
    return new Map(
        readdirSync(dir)
            .filter((name) => name.endsWith('.json'))
            .map((name) => {
                const node = JSON.parse(readFileSync(resolve(dir, name), 'utf8')) as {
                    id: string;
                    npc_id: string | null;
                    beats: unknown[];
                };
                return [node.id, node] as const;
            }),
    );
}

describe('authored map content contracts', () => {
    it('T4-15: every shipped region has at least five authored NPC markers', () => {
        for (const [mapId, spec] of SHIPPED_SPECS) {
            expect(npcNames(spec).length, `${mapId} NPC floor`).toBeGreaterThanOrEqual(5);
        }
    });

    it('T4-14: every authored species appears in a catchable encounter table', () => {
        const speciesDir = resolve(__dirname, '../../src/content/spine/species');
        const authoredSpecies = readdirSync(speciesDir)
            .filter((name) => name.endsWith('.json'))
            .map((name) => {
                const raw = JSON.parse(readFileSync(resolve(speciesDir, name), 'utf8')) as { id: string };
                return raw.id;
            })
            .sort();
        const catchableSpecies = new Set<string>();

        for (const [, spec] of SHIPPED_SPECS) {
            for (const encounter of spec.layers.Encounters ?? []) {
                for (const speciesId of Object.keys(encounter.species)) {
                    catchableSpecies.add(speciesId);
                }
            }
        }

        expect(authoredSpecies.filter((speciesId) => !catchableSpecies.has(speciesId))).toEqual([]);
    });

    it('T4-15: new regional NPC dialog nodes are spine-backed and multi-beat', () => {
        const dialogs = dialogNodesById();
        const newDialogIds = [
            'jan_pona_tomo_welcome',
            'jan_telo_well_water',
            'jan_poki_tomo_ready',
            'jan_kili_tomo_snack',
            'jan_palisa_nasin_sign',
            'jan_kasi_nasin_grass',
            'jan_poki_nasin_pack',
            'jan_lukin_nasin_watch',
            'jan_kiwen_mountain',
            'jan_waso_sewi_sky',
            'jan_nasin_sewi_path',
            'jan_sike_telo_plaza',
            'jan_suno_lete_light',
            'jan_poki_lete_cold',
            'jan_kiwen_suli_cave',
            'jan_pimeja_suli_torch',
            'jan_suno_telo_last',
        ];

        for (const dialogId of newDialogIds) {
            const node = dialogs.get(dialogId);
            expect(node, dialogId).toBeDefined();
            expect(node?.npc_id, dialogId).toMatch(/^jan_/);
            expect(node?.beats.length, dialogId).toBeGreaterThanOrEqual(2);
        }
    });

    it('T4-02: nasin_wan uses the seasons forest tileset instead of placeholder core grass', () => {
        expect(nasinWan.biome).toBe('forest');
        expect(nasinWan.tilesets).toEqual(
            expect.arrayContaining([
                'seasons/Tileset_Ground_Seasons',
                'seasons/Tileset_Road',
                'seasons/Tileset_TallGrass',
                'seasons/Objects_Trees_Seasons',
            ]),
        );
        expect(nasinWan.tilesets).not.toContain('core/Tileset_Ground');
    });

    it('T4-02: nasin_wan has forest paint, encounter grass, pathing, and tree cover', () => {
        const below = nasinWan.layers['Below Player'];
        if (!isTileGrid(below)) throw new Error('expected nasin_wan Below Player to be a tile grid');

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(['g', 'f', 'v', 'd', 'G']));
        expect(below[5].every((cell) => cell === 'd')).toBe(true);

        const world = nasinWan.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error('expected nasin_wan World to be placed forest tiles');
        }
        const placed = world.map((entry) => entry.tile);
        expect(placed.some((tile) => tile.startsWith('tree_'))).toBe(true);
        expect(placed.some((tile) => tile.startsWith('bush_'))).toBe(true);
    });

    it('T4-03: nasin_pi_telo uses seasons water/shore tiles instead of placeholder core grass', () => {
        expect(nasinPiTelo.biome).toBe('water');
        expect(nasinPiTelo.tilesets).toEqual(
            expect.arrayContaining([
                'seasons/Tileset_Ground_Seasons',
                'seasons/Tileset_Road',
                'seasons/Tileset_Sand',
                'seasons/Tileset_TallGrass',
                'seasons/Tileset_Water',
            ]),
        );
        expect(nasinPiTelo.tilesets).not.toContain('core/Tileset_Ground');
    });

    it('T4-03: nasin_pi_telo has blocked water, encounter grass, and a playable sandbar route', () => {
        const below = nasinPiTelo.layers['Below Player'];
        if (!isTileGrid(below)) throw new Error('expected nasin_pi_telo Below Player to be a tile grid');

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(['g', 'f', 'v', 'd', 's', 'G', 'w']));
        expect(below.flat().filter((cell) => cell === 'w').length).toBeGreaterThanOrEqual(40);

        const markers = nasinPiTelo.layers.Objects ?? [];
        const finalTrigger = markers.find((marker) => marker.name === 'final_boss_trigger');
        expect(finalTrigger).toMatchObject({ type: 'Trigger', rect: [26, 5, 2, 3] });
        if (!finalTrigger || !('rect' in finalTrigger)) throw new Error('expected final_boss_trigger rect');
        const [x0, y0, w, h] = finalTrigger.rect;
        for (let y = y0; y < y0 + h; y++) {
            for (let x = x0; x < x0 + w; x++) {
                expect(below[y][x]).not.toBe('w');
            }
        }

        for (const marker of markers.filter((marker) => marker.type === 'NPC' || marker.type === 'SpawnPoint')) {
            if (!('at' in marker)) continue;
            const [x, y] = marker.at;
            expect(below[y][x]).not.toBe('w');
        }
    });

    it('T4-03: nasin_pi_telo water palette points at a Tiled collision tile', () => {
        const waterTile = waterPalette.w;
        expect(waterTile.tsx).toBe('seasons/Tileset_Water');

        const tsx = readFileSync(
            resolve(__dirname, '../../public/assets/tilesets/seasons/Tiled/Tilesets/Tileset_Water.tsx'),
            'utf8',
        );
        const tileBlock = new RegExp(`<tile id="${waterTile.local_id}"[\\s\\S]*?<\\/tile>`).exec(tsx)?.[0] ?? '';
        expect(tileBlock).toContain('<objectgroup');
    });

    it('T4-04: ma_telo uses a lake-village tileset set instead of placeholder core grass', () => {
        expect(maTelo.biome).toBe('town');
        expect(maTelo.tilesets).toEqual(
            expect.arrayContaining([
                'seasons/Tileset_Ground_Seasons',
                'seasons/Tileset_Road',
                'seasons/Tileset_Sand',
                'seasons/Tileset_Water',
                'seasons/Objects_Buildings_Seasons',
                'seasons/Objects_Trees_Seasons',
            ]),
        );
        expect(maTelo.tilesets).not.toContain('core/Tileset_Ground');
    });

    it('T4-04: ma_telo is a no-encounter lake village with reachable story/shop markers', () => {
        const below = maTelo.layers['Below Player'];
        if (!isTileGrid(below)) throw new Error('expected ma_telo Below Player to be a tile grid');

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(['g', 'v', 's', 'd', 'p', 'w']));
        expect(used.has('G')).toBe(false);
        expect(maTelo.layers.Encounters ?? []).toHaveLength(0);
        expect(below.flat().filter((cell) => cell === 'w').length).toBeGreaterThanOrEqual(60);

        const markers = maTelo.layers.Objects ?? [];
        const npcMarkers = markers.filter((marker) => marker.type === 'NPC');
        expect(npcMarkers.map((marker) => marker.name).sort()).toEqual([
            'jan-kala-lake',
            'jan-moku',
            'jan-olin-telo',
            'jan-sike-telo',
            'jan-telo',
        ]);
        expect(
            npcMarkers.find((marker) => marker.name === 'jan-moku'),
        ).toMatchObject({ props: { id: 'jan_moku', dialog_id: 'jan_moku_stall' } });
        expect(markers.find((marker) => marker.name === 'warp_north')).toMatchObject({
            type: 'Warp',
            rect: [15, 0, 1, 1],
            props: { target_map: 'ma_lete', target_spawn: 'from_ma_telo', required_flag: 'badge_telo' },
        });

        for (const marker of markers) {
            if ('at' in marker) {
                const [x, y] = marker.at;
                expect(below[y][x]).not.toBe('w');
            }
            if ('rect' in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) expect(below[y][x]).not.toBe('w');
                }
            }
        }
    });

    it('T4-04: ma_telo includes visual village landmarks', () => {
        const world = maTelo.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error('expected ma_telo World to be placed town landmarks');
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toEqual(expect.arrayContaining(['house_blue', 'house_red', 'market_stand']));
        expect(placed.some((tile) => tile.startsWith('tree_'))).toBe(true);
        expect(placed.some((tile) => tile.startsWith('bush_'))).toBe(true);
    });

    it('T4-05: ma_lete uses the snow tileset family instead of placeholder core grass', () => {
        expect(maLete.biome).toBe('ice');
        expect(maLete.tilesets).toEqual(
            expect.arrayContaining([
                'snow/Tileset_Ground_Snow',
                'snow/Tileset_Road',
                'snow/Tileset_Snow',
                'snow/Tileset_TallGrass',
                'snow/Tileset_Fence_1_Snow',
                'snow/Objects_Buildings_Snow',
                'snow/Objects_Props_Snow',
                'snow/Objects_Rocks_Snow',
                'snow/Objects_Trees_Snow',
            ]),
        );
        expect(maLete.tilesets).not.toContain('core/Tileset_Ground');
    });

    it('T4-05: ma_lete has cold village paint, encounter grass, and reachable story markers', () => {
        const below = maLete.layers['Below Player'];
        if (!isTileGrid(below)) throw new Error('expected ma_lete Below Player to be a tile grid');

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(['s', 'i', 'j', 'r', 'd', 'G']));
        expect(below.flat().filter((cell) => cell === 'G').length).toBeGreaterThanOrEqual(30);
        expect(maLete.layers.Encounters ?? []).toHaveLength(2);

        for (const encounter of maLete.layers.Encounters ?? []) {
            const [x0, y0, w, h] = encounter.rect;
            for (let y = y0; y < y0 + h; y++) {
                for (let x = x0; x < x0 + w; x++) expect(below[y][x]).toBe('G');
            }
        }

        const markers = maLete.layers.Objects ?? [];
        const npcMarkers = markers.filter((marker) => marker.type === 'NPC');
        expect(npcMarkers.map((marker) => marker.name).sort()).toEqual([
            'jan-anpa',
            'jan-kasi',
            'jan-lete',
            'jan-poki-lete',
            'jan-suno-lete',
        ]);
        expect(markers.find((marker) => marker.name === 'warp_north')).toMatchObject({
            type: 'Warp',
            rect: [17, 0, 1, 1],
            props: { target_map: 'nena_suli', target_spawn: 'from_ma_lete', required_flag: 'badge_lete' },
        });

        for (const marker of markers) {
            if ('at' in marker) {
                const [x, y] = marker.at;
                expect(below[y][x]).not.toBe('G');
            }
            if ('rect' in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) expect(below[y][x]).not.toBe('G');
                }
            }
        }
    });

    it('T4-05: ma_lete includes snow village landmarks and an encounter-grass collision tile', () => {
        const world = maLete.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error('expected ma_lete World to be placed snow landmarks');
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toEqual(
            expect.arrayContaining(['house_blue', 'house_red', 'well_snow', 'fence_h', 'crate_snow', 'rock_ice']),
        );
        expect(placed.some((tile) => tile.startsWith('tree_'))).toBe(true);
        expect(placed.some((tile) => tile.startsWith('bush_'))).toBe(true);

        const tallGrassTile = icePalette.G;
        expect(tallGrassTile.tsx).toBe('snow/Tileset_TallGrass');

        const tsx = readFileSync(
            resolve(__dirname, '../../public/assets/tilesets/snow/Tiled/Tilesets/Tileset_TallGrass.tsx'),
            'utf8',
        );
        const tileBlock = new RegExp(`<tile id="${tallGrassTile.local_id}"[\\s\\S]*?<\\/tile>`).exec(tsx)?.[0] ?? '';
        expect(tileBlock).toContain('<objectgroup');
    });

    it('T4-06: nena_sewi uses the mountain tileset set instead of placeholder core grass', () => {
        expect(nenaSewi.biome).toBe('peak');
        expect(nenaSewi.tilesets).toEqual(
            expect.arrayContaining([
                'seasons/Tileset_Ground_Seasons',
                'seasons/Tileset_Road',
                'seasons/Tileset_TallGrass',
                'seasons/Tileset_RockSlope_2_Gray',
                'seasons/Objects_Rocks_Seasons',
                'seasons/Objects_Trees_Seasons',
            ]),
        );
        expect(nenaSewi.tilesets).not.toContain('core/Tileset_Ground');
    });

    it('T4-06: nena_sewi has blocked cliffs, encounter grass, and reachable gym markers', () => {
        const below = nenaSewi.layers['Below Player'];
        if (!isTileGrid(below)) throw new Error('expected nena_sewi Below Player to be a tile grid');

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(['g', 'v', 'd', 'p', 'G', 'c']));
        expect(below.flat().filter((cell) => cell === 'c').length).toBeGreaterThanOrEqual(100);
        expect(nenaSewi.layers.Encounters ?? []).toHaveLength(2);

        for (const encounter of nenaSewi.layers.Encounters ?? []) {
            const [x0, y0, w, h] = encounter.rect;
            for (let y = y0; y < y0 + h; y++) {
                for (let x = x0; x < x0 + w; x++) expect(below[y][x]).toBe('G');
            }
        }

        const markers = nenaSewi.layers.Objects ?? [];
        expect(markers.filter((marker) => marker.type === 'NPC').map((marker) => marker.name).sort()).toEqual([
            'jan-kala',
            'jan-kiwen',
            'jan-nasin-sewi',
            'jan-waso-sewi',
            'jan-wawa',
        ]);
        expect(markers.find((marker) => marker.name === 'warp_north')).toMatchObject({
            type: 'Warp',
            rect: [24, 0, 1, 1],
            props: { target_map: 'ma_telo', target_spawn: 'from_nena_sewi', required_flag: 'badge_sewi' },
        });

        for (const marker of markers) {
            if ('at' in marker) {
                const [x, y] = marker.at;
                expect(below[y][x]).not.toBe('c');
                expect(below[y][x]).not.toBe('G');
            }
            if ('rect' in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) {
                        expect(below[y][x]).not.toBe('c');
                        expect(below[y][x]).not.toBe('G');
                    }
                }
            }
        }
    });

    it('T4-06: nena_sewi includes rock landmarks and cliff collision paint', () => {
        const world = nenaSewi.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error('expected nena_sewi World to be placed mountain landmarks');
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toEqual(expect.arrayContaining(['rock_small', 'rock_tall', 'rock_grass']));
        expect(placed.some((tile) => tile.startsWith('tree_'))).toBe(true);
        expect(placed.some((tile) => tile.startsWith('bush_'))).toBe(true);

        const cliffTile = mountainPalette.c;
        expect(cliffTile.tsx).toBe('seasons/Tileset_RockSlope_2_Gray');

        const tsx = readFileSync(
            resolve(__dirname, '../../public/assets/tilesets/seasons/Tiled/Tilesets/Tileset_RockSlope_2_Gray.tsx'),
            'utf8',
        );
        const tileBlock = new RegExp(`<tile id="${cliffTile.local_id}"[\\s\\S]*?<\\/tile>`).exec(tsx)?.[0] ?? '';
        expect(tileBlock).toContain('<objectgroup');
    });

    it('T4-07: nena_suli uses the fortress cave tileset set instead of placeholder core grass', () => {
        expect(nenaSuli.biome).toBe('cave');
        expect(nenaSuli.tilesets).toEqual(
            expect.arrayContaining([
                'fortress/Castle_Floor',
                'fortress/Tileset_RockSlope',
                'fortress/Tileset_Castle_Grass',
                'fortress/Animation_Torch_1',
            ]),
        );
        expect(nenaSuli.tilesets).not.toContain('core/Tileset_Ground');
    });

    it('T4-07: nena_suli has blocked cave walls, encounter patches, and reachable peak markers', () => {
        const below = nenaSuli.layers['Below Player'];
        if (!isTileGrid(below)) throw new Error('expected nena_suli Below Player to be a tile grid');

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(['f', 'p', 'v', 'w', 'G']));
        expect(below.flat().filter((cell) => cell === 'w').length).toBeGreaterThanOrEqual(100);
        expect(nenaSuli.layers.Encounters ?? []).toHaveLength(2);

        for (const encounter of nenaSuli.layers.Encounters ?? []) {
            const [x0, y0, w, h] = encounter.rect;
            for (let y = y0; y < y0 + h; y++) {
                for (let x = x0; x < x0 + w; x++) expect(below[y][x]).toBe('G');
            }
        }

        const markers = nenaSuli.layers.Objects ?? [];
        expect(markers.filter((marker) => marker.type === 'NPC').map((marker) => marker.name).sort()).toEqual([
            'jan-kiwen-suli',
            'jan-pi-kon',
            'jan-pi-nasin',
            'jan-pimeja-suli',
            'jan-suli',
        ]);
        expect(markers.find((marker) => marker.name === 'warp_north')).toMatchObject({
            type: 'Warp',
            rect: [8, 0, 1, 1],
            props: { target_map: 'nasin_pi_telo', target_spawn: 'from_nena_suli', required_flag: 'badge_suli' },
        });

        for (const marker of markers) {
            if ('at' in marker) {
                const [x, y] = marker.at;
                expect(below[y][x]).not.toBe('w');
                expect(below[y][x]).not.toBe('G');
            }
            if ('rect' in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) {
                        expect(below[y][x]).not.toBe('w');
                        expect(below[y][x]).not.toBe('G');
                    }
                }
            }
        }
    });

    it('T4-07: nena_suli includes torch landmarks and cave-wall collision paint', () => {
        const world = nenaSuli.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error('expected nena_suli World to be placed cave landmarks');
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toContain('torch');
        expect(placed).toContain('torch_wall');

        const wallTile = cavePalette.w;
        expect(wallTile.tsx).toBe('fortress/Tileset_RockSlope');

        const wallTsx = readFileSync(
            resolve(__dirname, '../../public/assets/tilesets/fortress/Tiled/Tilesets/Tileset_RockSlope.tsx'),
            'utf8',
        );
        const wallBlock = new RegExp(`<tile id="${wallTile.local_id}"[\\s\\S]*?<\\/tile>`).exec(wallTsx)?.[0] ?? '';
        expect(wallBlock).toContain('<objectgroup');

        const torchTsx = readFileSync(
            resolve(__dirname, '../../public/assets/tilesets/fortress/Tiled/Tilesets/Animation_Torch_1.tsx'),
            'utf8',
        );
        const torchBlock = new RegExp(`<tile id="${cavePalette.torch.local_id}"[\\s\\S]*?<\\/tile>`).exec(torchTsx)?.[0] ?? '';
        expect(torchBlock).toContain('<animation>');
    });
});
