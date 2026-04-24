#!/usr/bin/env node
/**
 * Compile spine files → src/content/generated/world.json.
 *
 * Steps:
 *   1. Read every JSON under src/content/spine/.
 *   2. Read emitted TMJ map object layers.
 *   3. Assemble a World object with shape
 *      { schema_version, title, start_region_id, species, moves, items, dialog, journey, maps }
 *      and write it to src/content/generated/world.json.
 *
 * Region JSON files no longer exist. Per-region content (NPCs, warps,
 * encounters, set-piece triggers) lives in Tiled Object/Encounters layers
 * inside TMJ map packages under `public/assets/maps/<map_id>.tmj`. The
 * journey manifest (`src/content/spine/journey.json`) is the ordered arc
 * through those maps and is the source of truth for the L4 interaction layer.
 *
 * English is now the runtime language. The compiler preserves authored
 * `{ en: "..." }` translatables verbatim and does not resolve or require a
 * parallel-language corpus.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const spineDir = resolve(root, "src/content/spine");
const outPath = resolve(root, "src/content/generated/world.json");
const mapsDir = resolve(root, "public/assets/maps");
const verbose = process.argv.includes("--verbose");

function logVerbose(message) {
    if (verbose) console.log(`[build-spine] ${message}`);
}

if (!existsSync(spineDir)) {
    console.error("[build-spine] spine directory missing — cannot build world.json");
    process.exit(1);
}

function readJsonFile(file, label) {
    try {
        return JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
        const rel = relative(root, file).replace(/\\/g, "/");
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`[build-spine] failed to parse ${label} ${rel}: ${message}`);
    }
}

function listJsonRecursive(dir) {
    const out = [];
    const walk = (d) => {
        for (const entry of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, entry.name);
            if (entry.isDirectory()) walk(p);
            else if (entry.isFile() && p.endsWith(".json")) out.push(p);
        }
    };
    walk(dir);
    return out;
}

function listTmjFiles(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter((file) => file.endsWith(".tmj"))
        .map((file) => join(dir, file));
}

function propertiesToRecord(properties) {
    const out = {};
    if (!Array.isArray(properties)) return out;
    for (const property of properties) {
        if (!property || typeof property.name !== "string") continue;
        out[property.name] = property.value;
    }
    return out;
}

function collectCompiledMaps() {
    return listTmjFiles(mapsDir)
        .map((file) => {
            const tmj = readJsonFile(file, "TMJ map");
            const id = file
                .replace(/\\/g, "/")
                .split("/")
                .pop()
                .replace(/\.tmj$/, "");
            const objects = (tmj.layers ?? [])
                .filter((layer) => layer.type === "objectgroup")
                .flatMap((layer) =>
                    (layer.objects ?? []).map((object) => ({
                        layer: layer.name,
                        name: object.name ?? "",
                        type: object.type ?? "",
                        x: object.x ?? 0,
                        y: object.y ?? 0,
                        width: object.width ?? 0,
                        height: object.height ?? 0,
                        properties: propertiesToRecord(object.properties),
                    })),
                );
            logVerbose(
                `map ${id}: ${objects.length} object(s) from ${relative(root, file).replace(/\\/g, "/")}`,
            );
            return {
                id,
                width: tmj.width,
                height: tmj.height,
                tilewidth: tmj.tilewidth,
                tileheight: tmj.tileheight,
                objects,
            };
        })
        .sort((a, b) => a.id.localeCompare(b.id));
}

function mapPathForId(mapId) {
    return join(mapsDir, `${mapId}.tmj`);
}

function speciesIdsFromEncounterConfig(species) {
    if (!species) return [];
    if (typeof species === "string") {
        try {
            return speciesIdsFromEncounterConfig(JSON.parse(species));
        } catch {
            return [species];
        }
    }
    if (Array.isArray(species)) {
        return species
            .map((entry) => {
                if (typeof entry === "string") return entry;
                return entry?.species_id ?? entry?.id;
            })
            .filter(Boolean);
    }
    if (typeof species === "object") return Object.keys(species);
    return [];
}

function encounterObjectsFromTmj(tmj) {
    return (tmj.layers ?? [])
        .filter((layer) => layer.type === "objectgroup")
        .flatMap((layer) =>
            (layer.objects ?? [])
                .filter((object) => layer.name === "Encounters" || object.type === "Encounter")
                .map((object) => ({
                    layer: layer.name ?? "",
                    name: object.name ?? "",
                    properties: propertiesToRecord(object.properties),
                })),
        );
}

function allObjectPropertyValuesFromTmj(tmj) {
    return (tmj.layers ?? [])
        .filter((layer) => layer.type === "objectgroup")
        .flatMap((layer) =>
            (layer.objects ?? []).flatMap((object) => [
                object.name ?? "",
                object.type ?? "",
                ...Object.values(propertiesToRecord(object.properties)),
            ]),
        )
        .filter((value) => typeof value === "string");
}

const spineFiles = listJsonRecursive(spineDir);
if (spineFiles.length === 0) {
    console.error(`[build-spine] no spine files found under ${spineDir} — cannot build world.json`);
    process.exit(1);
}
logVerbose(
    `reading ${spineFiles.length} spine file(s) from ${relative(root, spineDir).replace(/\\/g, "/")}`,
);

/** @typedef {{
 *   species: any[];
 *   moves: any[];
 *   items: any[];
 *   dialog: any[];
 *   journey?: any;
 *   world?: any;
 *   unclassified: string[];
 * }} Collected
 */
/** @type {Collected} */
const collected = {
    species: [],
    moves: [],
    items: [],
    dialog: [],
    unclassified: [],
};

for (const file of spineFiles) {
    const body = readJsonFile(file, "spine JSON");
    // Use path.relative + normalise separators so classification works on both
    // POSIX and Windows (file.replace(`${root}/`, '') breaks on Windows paths).
    const rel = relative(root, file).replace(/\\/g, "/");
    if (rel.includes("/species/")) {
        collected.species.push(body);
        logVerbose(`${rel}: species 1`);
    } else if (rel.includes("/moves/")) {
        collected.moves.push(body);
        logVerbose(`${rel}: move 1`);
    } else if (rel.includes("/items/")) {
        collected.items.push(body);
        logVerbose(`${rel}: item 1`);
    } else if (rel.includes("/dialog/")) {
        collected.dialog.push(body);
        logVerbose(`${rel}: dialog ${Array.isArray(body) ? body.length : 1}`);
    } else if (rel.endsWith("/journey.json")) {
        collected.journey = body;
        logVerbose(`${rel}: journey ${Array.isArray(body?.beats) ? body.beats.length : 0} beat(s)`);
    } else if (rel.endsWith("/world.json")) {
        collected.world = body;
        logVerbose(`${rel}: world metadata`);
    } else {
        collected.unclassified.push(rel);
        console.warn(`[build-spine] unclassified spine file: ${rel}`);
    }
}

if (!collected.journey) {
    console.error(
        "[build-spine] missing src/content/spine/journey.json — required by the new architecture",
    );
    process.exit(1);
}
if (!Array.isArray(collected.journey.beats) || collected.journey.beats.length === 0) {
    console.error(
        "[build-spine] journey.json has no beats — the arc must declare at least one beat",
    );
    process.exit(1);
}

// Cross-check: every beat's map_id must be lower-snake-case and point at an
// emitted public/assets/maps/<map_id>.tmj artifact.
for (const [i, beat] of collected.journey.beats.entries()) {
    if (typeof beat.map_id !== "string" || !/^[a-z][a-z0-9_]*$/.test(beat.map_id)) {
        console.error(
            `[build-spine] journey beat #${i} has invalid map_id: ${JSON.stringify(beat.map_id)}`,
        );
        process.exit(1);
    }
    if (typeof beat.id !== "string" || !/^[a-z][a-z0-9_]*$/.test(beat.id)) {
        console.error(`[build-spine] journey beat #${i} (map_id=${beat.map_id}) has invalid id`);
        process.exit(1);
    }
    const beatMapPath = mapPathForId(beat.map_id);
    if (!existsSync(beatMapPath)) {
        console.error(
            `[build-spine] journey beat #${i} (${beat.id}) references missing map artifact: ${relative(root, beatMapPath).replace(/\\/g, "/")}`,
        );
        process.exit(1);
    }
}

const itemIds = new Set(collected.items.map((item) => item?.id).filter(Boolean));
for (const entry of collected.species) {
    const drop = entry?.item_drop;
    if (!drop) continue;
    if (!itemIds.has(drop.item_id)) {
        console.error(
            `[build-spine] species ${entry.id} item_drop references missing item: ${JSON.stringify(drop.item_id)}`,
        );
        process.exit(1);
    }
}

// Enforce the green-dragon endgame rule: the green dragon species and event
// must never appear in encounter tables or trigger wiring before the final beat.
const GREEN_DRAGON_SPECIES_ID = "green_dragon";
const GREEN_DRAGON_EVENT_ID = "green_dragon";
// Walk all non-final beats (indices 0..len-2). The final beat is the only
// one allowed to feature green_dragon, so we skip it by iterating to len-1.
for (let i = 0; i < collected.journey.beats.length - 1; i++) {
    const beat = collected.journey.beats[i];
    if (beat.encounters) {
        for (const zone of beat.encounters) {
            const ids = speciesIdsFromEncounterConfig(zone.species);
            if (ids.includes(GREEN_DRAGON_SPECIES_ID) || ids.includes(GREEN_DRAGON_EVENT_ID)) {
                console.error(
                    `[build-spine] green dragon found in inline encounter table ` +
                        `of beat #${i + 1} (${beat.id}) — it is reserved for beat 7 only`,
                );
                process.exit(1);
            }
        }
    }

    const tmj = readJsonFile(mapPathForId(beat.map_id), "TMJ map");
    for (const object of encounterObjectsFromTmj(tmj)) {
        const ids = speciesIdsFromEncounterConfig(object.properties.species);
        if (ids.includes(GREEN_DRAGON_SPECIES_ID) || ids.includes(GREEN_DRAGON_EVENT_ID)) {
            console.error(
                `[build-spine] green dragon found in ${beat.map_id}.${object.layer}.${object.name} ` +
                    `encounter table — it is reserved for beat 7 only`,
            );
            process.exit(1);
        }
    }

    if (allObjectPropertyValuesFromTmj(tmj).includes(GREEN_DRAGON_EVENT_ID)) {
        console.error(
            `[build-spine] green dragon event wiring found in non-final beat ${beat.id} (${beat.map_id})`,
        );
        process.exit(1);
    }
}

const world = collected.world ?? {};
const startRegionId = collected.journey.beats[0]?.map_id ?? "";
if (world.start_region_id && world.start_region_id !== startRegionId) {
    console.error(
        `[build-spine] world.start_region_id (${world.start_region_id}) does not match ` +
            `first journey beat map_id (${startRegionId}) — they must agree to avoid boot/journey desyncs`,
    );
    process.exit(1);
}
const output = {
    schema_version: 1,
    title: world.title ?? { en: "Rivers Reckoning" },
    start_region_id: world.start_region_id ?? startRegionId,
    species: collected.species,
    moves: collected.moves,
    items: collected.items,
    dialog: collected.dialog,
    journey: collected.journey,
    maps: collectCompiledMaps(),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
console.log(
    `[build-spine] ✓ ${collected.species.length} species, ${collected.moves.length} moves, ${collected.items.length} items, ${collected.dialog.length} dialog node(s), ${collected.journey.beats.length} journey beat(s) → ${outPath.replace(root + "/", "")}`,
);
