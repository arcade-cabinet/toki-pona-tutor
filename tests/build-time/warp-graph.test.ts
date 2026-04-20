import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const TILED_DIR = join(ROOT, 'src/tiled');

type Warp = { source_map: string; target_map: string; target_spawn: string; required_flag?: string };
type SpawnPoint = { map_id: string; name: string };

function mapIdFromFile(file: string): string {
    return file.replace(/\.tmx$/, '');
}

function parseTmx(mapId: string, tmxContent: string): { warps: Warp[]; spawns: SpawnPoint[] } {
    const warps: Warp[] = [];
    const spawns: SpawnPoint[] = [];

    // Handle both `<object .../>` (self-closing, no child properties — the
    // emitter uses this shape for plain SpawnPoint/NPC objects without
    // a <properties> block) and the long form `<object ...>...</object>`.
    const openTagRegex = /<object\b[^>]*?\/?>/g;
    let match: RegExpExecArray | null;
    while ((match = openTagRegex.exec(tmxContent)) !== null) {
        const openTag = match[0];
        const isSelfClosing = openTag.endsWith('/>');
        const typeMatch = openTag.match(/\btype="([^"]+)"/);
        const nameMatch = openTag.match(/\bname="([^"]*)"/);
        if (!typeMatch) continue;
        const type = typeMatch[1];
        const name = nameMatch ? nameMatch[1] : '';

        const props: Record<string, string> = {};
        if (!isSelfClosing) {
            const bodyStart = openTagRegex.lastIndex;
            const closeIdx = tmxContent.indexOf('</object>', bodyStart);
            if (closeIdx !== -1) {
                const body = tmxContent.slice(bodyStart, closeIdx);
                const propRegex = /<property\s+name="([^"]+)"\s+value="([^"]*)"/g;
                let pm: RegExpExecArray | null;
                while ((pm = propRegex.exec(body)) !== null) {
                    props[pm[1]] = pm[2];
                }
            }
        }

        if (type === 'Warp') {
            if (props.target_map && props.target_spawn) {
                const warp: Warp = { source_map: mapId, target_map: props.target_map, target_spawn: props.target_spawn };
                if (props.required_flag) warp.required_flag = props.required_flag;
                warps.push(warp);
            }
        } else if (type === 'SpawnPoint' && name) {
            spawns.push({ map_id: mapId, name });
        }
    }
    return { warps, spawns };
}

const tmxFiles = readdirSync(TILED_DIR).filter((f) => f.endsWith('.tmx'));
const allMaps = tmxFiles.map(mapIdFromFile);
const allWarps: Warp[] = [];
const allSpawns: SpawnPoint[] = [];
for (const file of tmxFiles) {
    const mapId = mapIdFromFile(file);
    const parsed = parseTmx(mapId, readFileSync(join(TILED_DIR, file), 'utf-8'));
    allWarps.push(...parsed.warps);
    allSpawns.push(...parsed.spawns);
}

const world = JSON.parse(
    readFileSync(join(ROOT, 'src/content/generated/world.json'), 'utf-8'),
) as { start_region_id: string; journey: { beats: { map_id: string }[] } };

describe('T6-08: warp-graph topology', () => {
    it('discovered at least 2 maps', () => {
        expect(allMaps.length).toBeGreaterThanOrEqual(2);
    });

    it('every warp points at an existing map', () => {
        const mapSet = new Set(allMaps);
        for (const w of allWarps) {
            expect(mapSet.has(w.target_map), w.source_map + ' warps to missing ' + w.target_map).toBe(true);
        }
    });

    it('every warp target_spawn exists on the target map', () => {
        const spawnsByMap = new Map<string, Set<string>>();
        for (const s of allSpawns) {
            if (!spawnsByMap.has(s.map_id)) spawnsByMap.set(s.map_id, new Set());
            spawnsByMap.get(s.map_id)!.add(s.name);
        }
        for (const w of allWarps) {
            const spawns = spawnsByMap.get(w.target_map) ?? new Set();
            expect(
                spawns.has(w.target_spawn),
                w.source_map + ' -> ' + w.target_map + ' references missing SpawnPoint ' + w.target_spawn,
            ).toBe(true);
        }
    });

    it('no self-loop warps', () => {
        for (const w of allWarps) {
            expect(w.source_map, w.source_map + ' warps to itself').not.toBe(w.target_map);
        }
    });

    it('BFS from start_region_id reaches every journey beat map', () => {
        const start = world.start_region_id;
        const beatMaps = new Set(world.journey.beats.map((b) => b.map_id));
        const adj = new Map<string, Set<string>>();
        for (const w of allWarps) {
            if (!adj.has(w.source_map)) adj.set(w.source_map, new Set());
            adj.get(w.source_map)!.add(w.target_map);
        }
        const visited = new Set<string>();
        const queue = [start];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);
            for (const next of adj.get(current) ?? []) {
                if (!visited.has(next)) queue.push(next);
            }
        }
        const unreachable = [...beatMaps].filter((m) => !visited.has(m));
        expect(unreachable).toHaveLength(0);
    });
});
