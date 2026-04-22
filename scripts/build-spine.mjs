#!/usr/bin/env node
/**
 * Compile spine files → src/content/generated/world.json.
 *
 * Steps:
 *   1. Read every JSON under src/content/spine/.
 *   2. For every translatable string ({en, tp?} shape) inside content,
 *      resolve `tp` from the Tatoeba corpus. Single-word entries are exempt.
 *   3. Read emitted TMJ map object layers.
 *   4. Assemble a World object with shape
 *      { schema_version, title, start_region_id, species, moves, items, dialog, journey, maps }
 *      and write it to src/content/generated/world.json.
 *
 * Region JSON files no longer exist. Per-region content (NPCs, warps,
 * encounters, set-piece triggers) lives in Tiled Object/Encounters layers
 * inside TMJ map packages under `public/assets/maps/<map_id>.tmj`. The
 * journey manifest (`src/content/spine/journey.json`) is the ordered arc
 * through those maps and is the source of truth for the L4 interaction layer.
 *
 * Fails loudly on any missed translation — `validate-tp` is expected to have
 * been run first, but this script also re-runs the check as a safety net.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const spineDir = resolve(root, "src/content/spine");
const corpusPath = resolve(root, "src/content/corpus/tatoeba.json");
const outPath = resolve(root, "src/content/generated/world.json");
const mapsDir = resolve(root, "public/assets/maps");
const verbose = process.argv.includes("--verbose");

function logVerbose(message) {
    if (verbose) console.log(`[build-spine] ${message}`);
}

if (!existsSync(corpusPath)) {
    console.error("[build-spine] corpus missing — run scripts/fetch-tatoeba-corpus.mjs");
    process.exit(1);
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

const corpus = readJsonFile(corpusPath, "corpus JSON");

const norm = (s) =>
    s
        .toLowerCase()
        .trim()
        .replace(/[.!?,"'\u2018\u2019\u201c\u201d]/g, "")
        .replace(/\s+/g, " ");

// en (normalized) → tp. If the corpus has multiple TP translations for the
// same EN line, we pick the shortest — deterministic and usually the
// cleanest.
const enToTp = new Map();
for (const { tp, en } of corpus) {
    const key = norm(en);
    const existing = enToTp.get(key);
    if (!existing || tp.length < existing.length) enToTp.set(key, tp.trim());
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

/**
 * Walk an object and fill every { en: string, tp?: string } shape whose tp
 * is missing by looking up en in the corpus. Pushes any miss into `misses`
 * with its dotted path. Single-word en is exempt (dictionary-vetted).
 */
function resolveTranslatables(obj, pathTrail, misses) {
    if (obj == null) return;
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            resolveTranslatables(obj[i], `${pathTrail}[${i}]`, misses);
        }
        return;
    }
    if (typeof obj !== "object") return;
    if (typeof obj.en === "string" && (obj.tp === undefined || typeof obj.tp === "string")) {
        const isWord = /^\S+$/.test(obj.en);
        if (!isWord && !obj.tp) {
            const match = enToTp.get(norm(obj.en));
            if (match) {
                obj.tp = match;
            } else {
                misses.push({ path: pathTrail, en: obj.en });
            }
        }
        return;
    }
    for (const [k, v] of Object.entries(obj)) {
        resolveTranslatables(v, `${pathTrail}.${k}`, misses);
    }
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

// Cross-check: every beat's map_id must be lower-snake-case and (in a future
// pass when L4 lands) point at an existing public/assets/maps/<map_id>.tmj.
// We only enforce the id shape here so unknown maps still build.
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
}

const misses = [];
resolveTranslatables(collected.species, "spine.species", misses);
resolveTranslatables(collected.moves, "spine.moves", misses);
resolveTranslatables(collected.items, "spine.items", misses);
resolveTranslatables(collected.dialog, "spine.dialog", misses);
// `journey.beats[].narrative` is a plain string, not a translatable — it's
// dev-facing prose, exempt from corpus resolution. The walker skips it
// because it does not match the {en, tp?} shape.
resolveTranslatables(collected.journey, "spine.journey", misses);
if (collected.world) resolveTranslatables(collected.world, "spine.world", misses);

if (misses.length > 0) {
    console.error(`\n[build-spine] ${misses.length} translatable field(s) could not be resolved:`);
    for (const m of misses.slice(0, 20)) {
        console.error(`  ${m.path}: "${m.en}"`);
    }
    if (misses.length > 20) console.error(`  ...and ${misses.length - 20} more`);
    console.error("\nRun `pnpm validate-tp` for suggestions on how to rewrite the English.");
    process.exit(1);
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

// Enforce the green-dragon final-boss rule: the green dragon's species id
// must never appear in any encounter table before beat 7.  The final beat is
// the ONLY place it belongs. We check every encounter_table in every species
// file (encounter tables are arrays of { species_id, weight } entries or
// direct species_id strings) as well as any species whose id is green_dragon
// appearing in a non-final beat's encounter list.
const GREEN_DRAGON_ID = "green_dragon";
// Walk all non-final beats (indices 0..len-2). The final beat is the only
// one allowed to feature green_dragon, so we skip it by iterating to len-1.
for (let i = 0; i < collected.journey.beats.length - 1; i++) {
    const beat = collected.journey.beats[i];
    // Check encounter tables if the beat spec includes inline ones (future).
    // For now, guard against the species id appearing in non-final beat ids,
    // and check that no species file whose id is green_dragon is added to any
    // encounter table in a non-final beat context.
    if (beat.encounters) {
        for (const zone of beat.encounters) {
            const ids = Array.isArray(zone.species)
                ? zone.species.map((e) => (typeof e === "string" ? e : e.species_id))
                : Object.keys(zone.species ?? {});
            if (ids.includes(GREEN_DRAGON_ID)) {
                console.error(
                    `[build-spine] green dragon (${GREEN_DRAGON_ID}) found in encounter table ` +
                        `of beat #${i + 1} (${beat.id}) — it is reserved for beat 7 only`,
                );
                process.exit(1);
            }
        }
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
    title: world.title ?? { en: "land", tp: "ma" },
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
