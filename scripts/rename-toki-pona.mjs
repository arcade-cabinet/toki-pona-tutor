#!/usr/bin/env node
/**
 * T2-04 Phase B — full toki-pona → English rename.
 *
 * Atomically renames every internal ID across the content pipeline:
 *   - spine/species/*.json + their `id` fields
 *   - spine/moves/*.json + their `id` fields
 *   - spine/items/*.json + their `id` fields
 *   - spine/dialog/*.json + their `id` fields + dialog cross-references
 *   - content/gameplay/*.json (events, quests, ui, visuals, audio) references
 *   - test files, doc refs, any TS source referencing the old IDs
 *
 * Not renamed:
 *   - CHANGELOG.md (historical record)
 *   - docs/LORE.md narrative prose (will be rewritten manually with new names)
 *   - Legacy compat aliases in persistence layer (owned by T1-05 save migration)
 *
 * Run: `node scripts/rename-toki-pona.mjs`
 */

import { readFileSync, writeFileSync, readdirSync, renameSync, statSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Full mapping: old_id → new_id.
// Species, moves, items, NPCs. Dialog IDs rename keyed off the NPC rename.
const ID_RENAMES = {
    // ─── Species (43) ────────────────────────────────────────────────
    vine_adder: "vine_adder",
    ember_adder: "ember_adder",
    green_dragon: "green_dragon",
    marshjaw: "marshjaw",
    bramble_imp: "bramble_imp",
    bog_wisp: "bog_wisp",
    iron_wraith: "iron_wraith",
    nightspike: "nightspike",
    thornling: "thornling",
    stoneclaw: "stoneclaw",
    tarrin: "stone_bruiser",
    mire_brute: "mire_brute",
    chainback: "chainback",
    mountain_bear: "mountain_bear",
    warback: "warback",
    riverfin: "riverfin",
    bluefin: "bluefin",
    reedfrog: "reedfrog",
    snapper: "snapper",
    ashcat: "ashcat",
    cinderling: "cinderling",
    quartz_shell: "quartz_shell",
    frostcoil: "frostcoil",
    glacier_talon: "glacier_talon",
    foxhound: "foxhound",
    burrowmole: "burrowmole",
    mudgrub: "mudgrub",
    applepup: "applepup",
    pebbleback: "pebbleback",
    mistfox: "mistfox",
    mirthcat: "mirthcat",
    hillbuck: "hillbuck",
    twiglet: "twiglet",
    snowhare: "snowhare",
    fangrunner: "fangrunner",
    boulderhorn: "boulderhorn",
    mireling: "mireling",
    drowsy_owl: "drowsy_owl",
    snowbird: "snowbird",
    coalbeak: "coalbeak",
    raven_shade: "raven_shade",
    nightjar: "nightjar",
    songbird: "songbird",

    // ─── Moves (17) ──────────────────────────────────────────────────
    leaf_jab: "leaf_jab",
    leaf_storm: "leaf_storm",
    stone_slam: "stone_slam",
    gust_strike: "gust_strike",
    frost_nip: "frost_nip",
    frost_soar: "frost_soar",
    frost_crash: "frost_crash",
    frost_surge: "frost_surge",
    ember_nip: "ember_nip",
    flame_strike: "flame_strike",
    splash: "splash",
    tide_ward: "tide_ward",
    wave_slam: "wave_slam",
    tidal_strike: "tidal_strike",
    strike: "strike",
    quick_jab: "quick_jab",
    wing_gust: "wing_gust",

    // ─── Items (5) ───────────────────────────────────────────────────
    orchard_fruit: "orchard_fruit",
    trail_token: "trail_token",
    capture_pod: "capture_pod",
    heavy_capture_pod: "heavy_capture_pod",
    spring_tonic: "spring_tonic",

    // ─── NPC event IDs (in events.json + referenced by dialog) ───────
    selby: "selby",
    piper: "piper",
    wren: "wren",
    oren: "oren",
    fig: "fig",
    loren: "loren",
    lily: "lily",
    grill: "grill",
    cormorant: "cormorant",
    myra: "myra",
    sola: "sola",
    marsha: "marsha",
    boulder: "boulder",
    graym: "graym",
    briar: "briar",
    hollis: "hollis",
    thorn: "thorn",
    lark: "lark",
    pack: "pack",
    ember: "ember",
    corvin: "corvin",
    meadow: "meadow",
    rowan: "rowan",
    kestrel: "kestrel",
    luma: "luma",
    tarn: "tarn",
    brindle: "brindle",
    shopkeep: "shopkeep",
    angler: "angler",
    rook: "rook",
    frost: "frost",
    cliff: "cliff",
    marin: "marin",
    tarrin: "tarrin",
    wheeler: "wheeler",

    // ─── Quest IDs (semantic renames, drop "quest_" prefix+toki) ─────
    quest_orchard_helper: "quest_orchard_helper",
    quest_greenwood_watch: "quest_greenwood_watch",
    quest_field_notes: "quest_field_notes",
    quest_lake_delivery: "quest_lake_delivery",
    quest_cold_hands: "quest_cold_hands",
    quest_torch_path_survey: "quest_torch_path_survey",
    quest_last_light: "quest_last_light",
    quest_safe_house: "quest_safe_house",
    quest_wild_signs: "quest_wild_signs",
    quest_shrine_stones: "quest_shrine_stones",
    quest_lost_hiker: "quest_lost_hiker",
    quest_water_edge: "quest_water_edge",
    quest_snowbird_sighting: "quest_snowbird_sighting",
    quest_cave_shadow: "quest_cave_shadow",
    quest_companion_bond: "quest_companion_bond",

    // ─── Dialog IDs (derive from NPC rename) ─────────────────────────
    selby_starter_intro: "selby_starter_intro",
    selby_after_pick: "selby_after_pick",
    rook_intro: "rook_intro",
    rook_victory: "rook_victory",
    frost_intro: "frost_intro",
    frost_victory: "frost_victory",
    cliff_intro: "cliff_intro",
    cliff_victory: "cliff_victory",
    marin_intro: "marin_intro",
    marin_victory: "marin_victory",
    tarrin_intro: "tarrin_intro",
    tarrin_victory: "tarrin_victory",
    loren_lake_quest: "loren_lake_quest",
    lily_flavor: "lily_flavor",
    angler_rest: "angler_rest",
    cormorant_tuneup: "cormorant_tuneup",
    hollis_garden: "hollis_garden",
    thorn_grass: "thorn_grass",
    fig_snack: "fig_snack",
    boulder_mountain: "boulder_mountain",
    graym_cave: "graym_cave",
    lark_watch: "lark_watch",
    grill_pona: "grill_pona",
    shopkeep_stall: "shopkeep_stall",
    marsha_path: "marsha_path",
    myra_quiet: "myra_quiet",
    briar_sign: "briar_sign",
    meadow_meditate: "meadow_meditate",
    rowan_ask: "rowan_ask",
    ember_torch: "ember_torch",
    brindle_cold: "brindle_cold",
    pack_runner: "pack_runner",
    oren_ready: "oren_ready",
    piper_welcome: "piper_welcome",
    tarn_plaza: "tarn_plaza",
    luma_light: "luma_light",
    sola_last: "sola_last",
    wren_well_water: "wren_well_water",
    kestrel_sky: "kestrel_sky",
    corvin_watch: "corvin_watch",

    // ─── Flags ───────────────────────────────────────────────────────
    rook_defeated: "rook_defeated",
    frost_defeated: "frost_defeated",
    cliff_defeated: "cliff_defeated",
    marin_defeated: "marin_defeated",
    tarrin_defeated: "tarrin_defeated",
};

// Files/directories to skip (historical, out-of-scope, or handled elsewhere)
const SKIP_PATHS = new Set([
    ".git",
    "node_modules",
    "dist",
    ".claude",
    "pending",
    ".worktrees",
    "CHANGELOG.md",
]);

// ─── Script body ─────────────────────────────────────────────────────

/**
 * Rewrite every `oldId` → `newId` inside the given file text.
 * Uses word-boundary matching so partial substrings aren't touched.
 */
function rewriteText(text) {
    let changed = false;
    let out = text;
    for (const [oldId, newId] of Object.entries(ID_RENAMES)) {
        // Match oldId as a whole word — prevents "selby" from eating "selby_starter_intro"
        // BUT we rely on the order: specific (longer) names should be in the
        // map too so they rename independently. Since map is an object and
        // keys may iterate in insertion order — luckily all longer keys are
        // listed explicitly (selby_starter_intro, selby_after_pick)
        // so they'll also be rewritten.
        const pattern = new RegExp(`\\b${oldId}\\b`, "g");
        if (pattern.test(out)) {
            out = out.replace(pattern, newId);
            changed = true;
        }
    }
    return { text: out, changed };
}

function walkFiles(dir, callback) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_PATHS.has(entry.name)) continue;
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(path, callback);
        } else if (entry.isFile()) {
            callback(path);
        }
    }
}

function isRelevantFile(path) {
    return /\.(ts|tsx|js|mjs|json|md|ce|yml|yaml)$/.test(path);
}

let filesTouched = 0;
let filesRenamed = 0;

// 1. Rename spine/*/<oldId>.json → spine/*/<newId>.json
const SPINE_DIRS = [
    "src/content/spine/species",
    "src/content/spine/moves",
    "src/content/spine/items",
    "src/content/spine/dialog",
];
for (const relDir of SPINE_DIRS) {
    const absDir = resolve(ROOT, relDir);
    for (const entry of readdirSync(absDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
        const oldBase = entry.name.replace(/\.json$/, "");
        const newBase = ID_RENAMES[oldBase];
        if (!newBase) continue;
        const oldPath = join(absDir, entry.name);
        const newPath = join(absDir, `${newBase}.json`);
        renameSync(oldPath, newPath);
        filesRenamed++;
        console.log(`renamed: ${relDir}/${entry.name} → ${newBase}.json`);
    }
}

// 2. Rewrite token references inside every relevant file
walkFiles(ROOT, (path) => {
    if (!isRelevantFile(path)) return;
    const rel = path.slice(ROOT.length + 1);
    if (rel.startsWith("CHANGELOG.md")) return;
    const text = readFileSync(path, "utf-8");
    const { text: newText, changed } = rewriteText(text);
    if (changed) {
        writeFileSync(path, newText);
        filesTouched++;
    }
});

console.log(`\n✓ renamed ${filesRenamed} spine files`);
console.log(`✓ updated ${filesTouched} file(s) with reference rewrites`);
