#!/usr/bin/env node
/**
 * T2-04 Phase B pass 2 — catch the old IDs that slipped past the
 * word-boundary regex in pass 1. Specifically:
 *   - species_<old> → species_<new>  (creature-sprites prefix)
 *   - quoted ID strings inside templates / prefixed identifiers
 *
 * Strategy: same mapping table, but match without leading `\b` so we
 * catch IDs that follow an underscore (treated as a word char by the
 * `\b` regex).
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Old → new mapping. Ordered most-specific-first so longer matches win.
const OLD_TO_NEW = [
    // ─── Species (sorted longest-first to avoid partial overwrites) ──
    ["jan_pi_sewi_pimeja", "nightspike"],
    ["jan_moli_wawa", "iron_wraith"],
    ["jan_utala_lili", "thornling"],
    ["jan_utala_suli", "stoneclaw"],
    ["jan_wawa_jaki", "mire_brute"],
    ["jan_wawa_linja", "chainback"],
    ["jan_wawa_suli", "mountain_bear"],
    ["jan_wawa_utala", "warback"],
    ["jan_ike_lili", "bramble_imp"],
    ["akesi_linja", "vine_adder"],
    ["akesi_seli", "ember_adder"],
    ["akesi_sewi", "green_dragon"],
    ["akesi_suli", "marshjaw"],
    ["jan_moli", "bog_wisp"],
    ["jan_wawa", "stone_bruiser"],
    ["kala_luka", "riverfin"],
    ["kala_telo", "bluefin"],
    ["kala_tomo", "reedfrog"],
    ["kala_uta", "snapper"],
    ["kon_moli", "ashcat"],
    ["seli_moli", "cinderling"],
    ["sijelo_kiwen", "quartz_shell"],
    ["sijelo_linja", "frostcoil"],
    ["sijelo_utala", "glacier_talon"],
    ["soweli_alasa", "foxhound"],
    ["soweli_anpa", "burrowmole"],
    ["soweli_jaki", "mudgrub"],
    ["soweli_kili", "applepup"],
    ["soweli_kiwen", "pebbleback"],
    ["soweli_kon", "mistfox"],
    ["soweli_musi", "mirthcat"],
    ["soweli_nena", "hillbuck"],
    ["soweli_palisa", "twiglet"],
    ["soweli_sewi", "snowhare"],
    ["soweli_utala", "fangrunner"],
    ["soweli_wawa", "boulderhorn"],
    ["telo_jaki", "mireling"],
    ["waso_lape", "drowsy_owl"],
    ["waso_lete", "snowbird"],
    ["waso_moku", "coalbeak"],
    ["waso_moli", "raven_shade"],
    ["waso_pimeja", "nightjar"],
    ["waso_toki", "songbird"],

    // ─── Moves ───────────────────────────────────────────────────────
    ["lete_lili", "frost_nip"],
    ["lete_sewi", "frost_soar"],
    ["lete_suli", "frost_crash"],
    ["lete_wawa", "frost_surge"],
    ["kasi_lili", "leaf_jab"],
    ["kasi_wawa", "leaf_storm"],
    ["kiwen_wawa", "stone_slam"],
    ["kon_wawa", "gust_strike"],
    ["seli_lili", "ember_nip"],
    ["seli_wawa", "flame_strike"],
    ["telo_lili", "splash"],
    ["telo_pini", "tide_ward"],
    ["telo_suli", "wave_slam"],
    ["telo_wawa", "tidal_strike"],
    ["utala_lili", "quick_jab"],
    ["wawa_waso", "wing_gust"],
    // Note: "utala" alone is too short / ambiguous, handle separately.

    // ─── Items ───────────────────────────────────────────────────────
    ["poki_lili", "capture_pod"],
    ["poki_wawa", "heavy_capture_pod"],
    ["telo_pona", "spring_tonic"],
    // Note: "kili" and "ma" are very short; only rename in specific contexts.

    // ─── NPC IDs (only the safe longer ones) ─────────────────────────
    ["jan_sewi_after_pick", "selby_after_pick"],
    ["jan_sewi_starter_intro", "selby_starter_intro"],
    ["jan_ike_defeated", "rook_defeated"],
    ["jan_lete_defeated", "frost_defeated"],
    ["jan_suli_defeated", "cliff_defeated"],
    ["jan_telo_defeated", "marin_defeated"],
    ["jan_wawa_defeated", "tarrin_defeated"],
    ["jan_ike_rival", "rook_rival"],

    // Quest IDs
    ["quest_tomo_kili", "quest_orchard_helper"],
    ["quest_nasin_forest_watch", "quest_greenwood_watch"],
    ["quest_nasin_poki_pack", "quest_field_notes"],
    ["quest_telo_kili_delivery", "quest_lake_delivery"],
    ["quest_lete_poki_pack", "quest_cold_hands"],
    ["quest_suli_torch", "quest_torch_path_survey"],
    ["quest_telo_last_light", "quest_last_light"],
    ["quest_tomo_safe_house", "quest_safe_house"],
    ["quest_nasin_wild_signs", "quest_wild_signs"],
    ["quest_sewi_shrine_stones", "quest_shrine_stones"],
    ["quest_sewi_lost_hiker", "quest_lost_hiker"],
    ["quest_telo_water_edge", "quest_water_edge"],
    ["quest_lete_snowbird", "quest_snowbird_sighting"],
    ["quest_suli_cave_shadow", "quest_cave_shadow"],
    ["quest_telo_companion_bond", "quest_companion_bond"],
];

const SKIP_PATHS = new Set([
    ".git",
    "node_modules",
    "dist",
    ".claude",
    "pending",
    ".worktrees",
    "CHANGELOG.md",
]);

function walkFiles(dir, cb) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_PATHS.has(entry.name)) continue;
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walkFiles(p, cb);
        else if (entry.isFile()) cb(p);
    }
}

function isRelevant(path) {
    return /\.(ts|tsx|js|mjs|json|md|ce|yml|yaml)$/.test(path);
}

let touched = 0;
walkFiles(ROOT, (path) => {
    if (!isRelevant(path)) return;
    const rel = path.slice(ROOT.length + 1);
    if (rel.startsWith("CHANGELOG.md")) return;
    if (rel === "scripts/rename-toki-pona.mjs") return;
    if (rel === "scripts/rename-toki-pona-pass2.mjs") return;
    let text = readFileSync(path, "utf-8");
    let changed = false;
    for (const [oldId, newId] of OLD_TO_NEW) {
        // No \b — match anywhere (after rename the old strings are gone)
        if (text.includes(oldId)) {
            text = text.split(oldId).join(newId);
            changed = true;
        }
    }
    if (changed) {
        writeFileSync(path, text);
        touched++;
    }
});
console.log(`✓ pass 2: updated ${touched} file(s)`);
