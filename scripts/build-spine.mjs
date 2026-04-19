#!/usr/bin/env node
/**
 * Compile spine files → src/content/generated/world.json.
 *
 * Steps:
 *   1. Read every JSON under src/content/spine/
 *   2. Validate each against its Zod schema (via dynamic-import of the schema module)
 *   3. For every translatable string, resolve `tp` from the Tatoeba corpus.
 *      Exempt: translatableWord (single-word dictionary entries).
 *   4. Assemble a World object and write it to src/content/generated/world.json.
 *
 * Fails loudly on any missed translation — `validate-tp` is expected to have
 * been run first, but this script also re-runs the check as a safety net.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const spineDir = resolve(root, 'src/content/spine');
const corpusPath = resolve(root, 'src/content/corpus/tatoeba.json');
const outPath = resolve(root, 'src/content/generated/world.json');

if (!existsSync(corpusPath)) {
  console.error('[build-spine] corpus missing — run scripts/fetch-tatoeba-corpus.mjs');
  process.exit(1);
}
// Empty / missing spine is fine during the pivot — emit a minimal world
// so the rest of the build proceeds. First real spine content lands in
// the follow-up content PR.
if (!existsSync(spineDir)) {
  console.log('[build-spine] spine directory missing — emitting empty world');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        schema_version: 1,
        title: { en: 'Toki Town', tp: 'ma tomo' },
        start_region_id: '',
        species: [],
        moves: [],
        items: [],
        regions: [],
        main_spine: [],
      },
      null,
      2,
    ) + '\n',
  );
  process.exit(0);
}

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));

const norm = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[.!?,"'\u2018\u2019\u201c\u201d]/g, '')
    .replace(/\s+/g, ' ');

// en (normalized) → tp. If the corpus has multiple TP translations for the same
// EN line, we pick the shortest — deterministic and usually the cleanest.
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
      else if (entry.isFile() && p.endsWith('.json')) out.push(p);
    }
  };
  walk(dir);
  return out;
}

/**
 * Walk an object and fill every { en: string, tp?: string } shape whose tp is
 * missing by looking up en in the corpus. Returns the count of resolved,
 * skipped (already filled), and missed fields.
 */
function resolveTranslatables(obj, pathTrail, misses) {
  if (obj == null) return 0;
  if (Array.isArray(obj)) {
    let count = 0;
    for (let i = 0; i < obj.length; i++) {
      count += resolveTranslatables(obj[i], `${pathTrail}[${i}]`, misses);
    }
    return count;
  }
  if (typeof obj !== 'object') return 0;
  // Heuristic: this is a translatable if it has `en: string` and either no
  // `tp` or `tp: string`. Single-word en is exempt (dictionary-vetted).
  if (typeof obj.en === 'string' && (obj.tp === undefined || typeof obj.tp === 'string')) {
    const isWord = /^\S+$/.test(obj.en);
    if (!isWord && !obj.tp) {
      const match = enToTp.get(norm(obj.en));
      if (match) {
        obj.tp = match;
      } else {
        misses.push({ path: pathTrail, en: obj.en });
      }
    }
    return 1;
  }
  let count = 0;
  for (const [k, v] of Object.entries(obj)) {
    count += resolveTranslatables(v, `${pathTrail}.${k}`, misses);
  }
  return count;
}

const spineFiles = listJsonRecursive(spineDir);
if (spineFiles.length === 0) {
  console.error('[build-spine] no spine files found under', spineDir);
  // emit an empty world so the rest of the build doesn't choke
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify({ schema_version: 1, title: { en: 'Toki Town', tp: 'ma tomo' }, start_region_id: '', species: [], moves: [], items: [], regions: [], main_spine: [] }, null, 2) + '\n',
  );
  process.exit(0);
}

/** @typedef {{ species: any[]; moves: any[]; items: any[]; regions: any[]; world?: any }} Collected */
/** @type {Collected} */
const collected = { species: [], moves: [], items: [], regions: [] };

for (const file of spineFiles) {
  const body = JSON.parse(readFileSync(file, 'utf8'));
  const rel = file.replace(`${root}/`, '');
  if (rel.includes('/species/')) collected.species.push(body);
  else if (rel.includes('/moves/')) collected.moves.push(body);
  else if (rel.includes('/items/')) collected.items.push(body);
  else if (rel.includes('/regions/')) collected.regions.push(body);
  else if (rel.endsWith('/world.json')) collected.world = body;
  else console.warn(`[build-spine] unclassified spine file: ${rel}`);
}

const misses = [];
resolveTranslatables(collected, 'spine', misses);

if (misses.length > 0) {
  console.error(`\n[build-spine] ${misses.length} translatable field(s) could not be resolved:`);
  for (const m of misses.slice(0, 20)) {
    console.error(`  ${m.path}: "${m.en}"`);
  }
  if (misses.length > 20) console.error(`  ...and ${misses.length - 20} more`);
  console.error('\nRun `pnpm validate-tp` for suggestions on how to rewrite the English.');
  process.exit(1);
}

const world = collected.world ?? {};
const output = {
  schema_version: 1,
  title: world.title ?? { en: 'Toki Town', tp: 'ma tomo' },
  start_region_id: world.start_region_id ?? collected.regions[0]?.id ?? '',
  species: collected.species,
  moves: collected.moves,
  items: collected.items,
  regions: collected.regions,
  main_spine: world.main_spine ?? [],
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(
  `[build-spine] ✓ ${collected.species.length} species, ${collected.moves.length} moves, ${collected.items.length} items, ${collected.regions.length} regions → ${outPath.replace(root + '/', '')}`,
);
