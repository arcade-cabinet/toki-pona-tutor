#!/usr/bin/env node
/**
 * T2-04 Phase C — finish the toki-pona → English rename.
 *
 * Phases A and B removed toki-pona from player-visible text and from
 * content IDs (species/moves/items/NPCs/quests/flags/dialogs). Phase C
 * cleans up the remaining tokens in:
 *
 *   1. The elemental type system (seli/telo/kasi/lete/wawa).
 *   2. Badge flag IDs (badge_highridge/badge_lakehaven/badge_frostvale/badge_dreadpeak).
 *   3. The ambient biome enum (village/kasi/lete/seli/telo/nena/indoor) —
 *      merged into map-metadata.ts MapBiome as the single source.
 *   4. `item.kind: "poki"` — replaced with `capture: true` + dropped
 *      from non-capture items.
 *   5. Settings screen: `sitelen` → `glyphs` value.
 *
 * Preserves:
 *   - `poki-soweli.` persistence key prefix (breaks saves if renamed).
 *   - DB name `poki_soweli` (breaks saves).
 *   - `/poki-soweli/` Pages base path (GitHub repo slug).
 *   - `poki-*` GUI ids and CSS classes (save/DOM-stable internal IDs).
 *
 * Run: `node scripts/rename-phase-c.mjs`
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ─── Mappings ────────────────────────────────────────────────────────

// Combat type tokens: used for creature.type, move.type, combatTypeSchema,
// combat-matchup matrices. We scope this to type-related contexts only
// because the same tokens collide with ambient biome names.
const TYPE_RENAMES = {
    seli: "fire",
    telo: "water",
    kasi: "grass",
    lete: "frost",
    wawa: "stone",
};

// Ambient biome tokens — rename everywhere but only inside files that are
// biome-scoped (ambient.json) or inside explicitly tagged contexts.
const BIOME_RENAMES = {
    village: "town",
    kasi: "forest",
    lete: "ice",
    seli: "volcanic",
    telo: "water",
    nena: "peak",
    // indoor stays as indoor
};

// Badge flag renames — always safe, unique tokens.
const BADGE_RENAMES = {
    badge_highridge: "badge_highridge",
    badge_lakehaven: "badge_lakehaven",
    badge_frostvale: "badge_frostvale",
    badge_dreadpeak: "badge_dreadpeak",
};

// Settings value renames.
const SETTINGS_VALUE_RENAMES = {
    sitelen: "glyphs",
};

// Skip paths entirely.
const SKIP_PATHS = new Set([
    ".git",
    "node_modules",
    "dist",
    ".claude",
    "pending",
    ".worktrees",
    "CHANGELOG.md",
    "src/content/generated", // regenerated from build-spine
]);

// Files/paths where we do NOT touch `poki-soweli` or `poki_soweli`.
// (These tokens stay; we never rewrite them anywhere in Phase C.)

// ─── Pass helpers ────────────────────────────────────────────────────

function readIfExists(path) {
    try {
        return readFileSync(path, "utf-8");
    } catch {
        return null;
    }
}

function writeChange(path, text, prev) {
    if (text === prev) return false;
    writeFileSync(path, text);
    return true;
}

function applyBadges(text) {
    let out = text;
    for (const [oldId, newId] of Object.entries(BADGE_RENAMES)) {
        out = out.replaceAll(new RegExp(`\\b${oldId}\\b`, "g"), newId);
    }
    return out;
}

function applySettingsValues(text) {
    // Only safe when "sitelen" appears as a JSON "value": "sitelen" token
    // or a JS/TS literal "sitelen" / 'sitelen' / case "sitelen":. We use a
    // conservative string-literal match.
    let out = text;
    for (const [oldId, newId] of Object.entries(SETTINGS_VALUE_RENAMES)) {
        out = out.replaceAll(new RegExp(`(['"\`])${oldId}\\1`, "g"), `$1${newId}$1`);
    }
    return out;
}

function applyTypeTokens(text) {
    let out = text;
    for (const [oldId, newId] of Object.entries(TYPE_RENAMES)) {
        // Only rewrite when the token appears as a string literal (JSON / TS)
        out = out.replaceAll(new RegExp(`(['"\`])${oldId}\\1`, "g"), `$1${newId}$1`);
    }
    return out;
}

function applyBiomeTokens(text) {
    let out = text;
    for (const [oldId, newId] of Object.entries(BIOME_RENAMES)) {
        // Only rewrite when the token appears as a string literal.
        out = out.replaceAll(new RegExp(`(['"\`])${oldId}\\1`, "g"), `$1${newId}$1`);
    }
    return out;
}

function applyPokiMoveSkill(text) {
    // `poki_move_` stays — it's a skill-prefix that's part of internal
    // identifier plumbing (save-stable). No-op, documented.
    return text;
}

// Specific transforms for the item.kind → capture boolean change.
function transformItemJson(raw) {
    // raw is parsed object.
    if (raw.kind === "poki") {
        delete raw.kind;
        raw.capture = true;
    } else if (typeof raw.kind === "string") {
        // heal / key / flavor — drop the field entirely
        delete raw.kind;
    }
    return raw;
}

// ─── Walk the tree ───────────────────────────────────────────────────

function walk(dir, fn) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_PATHS.has(entry.name)) continue;
        const abs = join(dir, entry.name);
        const rel = relative(ROOT, abs);
        if (SKIP_PATHS.has(rel)) continue;
        // Check for nested skip paths
        if (rel.startsWith("src/content/generated")) continue;
        if (entry.isDirectory()) walk(abs, fn);
        else if (entry.isFile()) fn(abs, rel);
    }
}

// ─── Pass 1: badges (global, safe) ──────────────────────────────────

let filesTouched = 0;

const FILE_EXTS = /\.(ts|tsx|js|mjs|json|md|ce|yml|yaml|tmx)$/;

walk(ROOT, (abs, rel) => {
    if (!FILE_EXTS.test(abs)) return;
    const prev = readIfExists(abs);
    if (prev === null) return;
    let text = prev;
    text = applyBadges(text);
    if (text !== prev) {
        writeFileSync(abs, text);
        filesTouched++;
        console.log(`  badges: ${rel}`);
    }
});

console.log(`✓ Pass 1 (badges): ${filesTouched} files`);
filesTouched = 0;

// ─── Pass 2: settings value (sitelen → glyphs) ──────────────────────

const SETTINGS_FILES = [
    "src/content/gameplay/ui.json",
    "src/content/gameplay/schema.ts", // already updated manually, this is a safety net
    "src/modules/main/settings-screen.ts",
    "src/modules/main/pause-menu.ts",
    "src/modules/main/vocabulary-screen.ts",
    "src/modules/main/ambient-events.ts",
];

// Apply settings-value rename to SETTINGS_FILES only (tight scope).
for (const rel of SETTINGS_FILES) {
    const abs = join(ROOT, rel);
    const prev = readIfExists(abs);
    if (prev === null) continue;
    let text = prev;
    // We only rename "sitelen" token when it appears as a case/value —
    // NOT when it's inside a property name like `sitelenOverlay`.
    // The conservative string-literal match handles that because
    // sitelenOverlay uses no quotes.
    text = applySettingsValues(text);
    if (writeChange(abs, text, prev)) {
        filesTouched++;
        console.log(`  settings-value: ${rel}`);
    }
}

console.log(`✓ Pass 2 (settings value): ${filesTouched} files`);
filesTouched = 0;

// ─── Pass 3: types — rewrite type literals in content + logic ───────

// Content files where we KNOW type tokens appear (no biome collision here):
const TYPE_CONTENT_FILES = [
    "src/content/gameplay/combat.json",
    "src/content/gameplay/progression.json",
    "src/content/gameplay/item-drops.json",
    "src/content/schema/types.ts", // already updated
];

// Species + moves — every type field is an elemental type.
walk(resolve(ROOT, "src/content/spine/species"), (abs, rel) => {
    TYPE_CONTENT_FILES.push(rel);
});
walk(resolve(ROOT, "src/content/spine/moves"), (abs, rel) => {
    TYPE_CONTENT_FILES.push(rel);
});

for (const rel of TYPE_CONTENT_FILES) {
    const abs = join(ROOT, rel);
    const prev = readIfExists(abs);
    if (prev === null) continue;
    const text = applyTypeTokens(prev);
    if (writeChange(abs, text, prev)) {
        filesTouched++;
        console.log(`  types: ${rel}`);
    }
}

console.log(`✓ Pass 3 (types): ${filesTouched} files`);
filesTouched = 0;

// ─── Pass 4: ambient biome — rewrite biome literals ─────────────────

// ambient.json is entirely biome-scoped — all keys there are biome tokens.
const AMBIENT_FILES = ["src/content/gameplay/ambient.json"];

for (const rel of AMBIENT_FILES) {
    const abs = join(ROOT, rel);
    const prev = readIfExists(abs);
    if (prev === null) continue;
    const text = applyBiomeTokens(prev);
    if (writeChange(abs, text, prev)) {
        filesTouched++;
        console.log(`  biomes: ${rel}`);
    }
}

console.log(`✓ Pass 4 (ambient biomes): ${filesTouched} files`);
filesTouched = 0;

// ─── Pass 5: item.kind → capture:true ───────────────────────────────

const ITEM_FILES = [];
walk(resolve(ROOT, "src/content/spine/items"), (abs, rel) => {
    if (abs.endsWith(".json")) ITEM_FILES.push(rel);
});

for (const rel of ITEM_FILES) {
    const abs = join(ROOT, rel);
    const prev = readIfExists(abs);
    if (prev === null) continue;
    let parsed;
    try {
        parsed = JSON.parse(prev);
    } catch {
        continue;
    }
    const transformed = transformItemJson({ ...parsed });
    const out = JSON.stringify(transformed, null, 2) + "\n";
    if (writeChange(abs, out, prev)) {
        filesTouched++;
        console.log(`  item.kind: ${rel}`);
    }
}

console.log(`✓ Pass 5 (item.kind → capture): ${filesTouched} files`);

console.log("\n✓ Phase C rename complete.");
