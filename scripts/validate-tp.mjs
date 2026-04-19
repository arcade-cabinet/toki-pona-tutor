#!/usr/bin/env node
/**
 * Validate every hand-authored Toki Pona line in shipped content against
 * the vendored Tatoeba corpus. Any `tp` value whose `en` counterpart does
 * not have an exact Tatoeba pair is flagged with the closest alternatives,
 * failing the build.
 *
 * This is the enforcement that keeps hallucinated TP out of the game.
 * Single-word phrases (common words in dictionary) are exempt — the whole
 * point of the corpus is to vet multi-word constructions.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const corpusPath = resolve(root, 'src/content/corpus/tatoeba.json');
const villagePath = resolve(root, 'src/content/village.json');

if (!existsSync(corpusPath)) {
  console.error('[validate-tp] corpus missing — run scripts/fetch-tatoeba-corpus.mjs');
  process.exit(1);
}

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
const village = JSON.parse(readFileSync(villagePath, 'utf8'));

const norm = (s) =>
  s.toLowerCase().trim().replace(/[.!?,"'\u2018\u2019\u201c\u201d]/g, '').replace(/\s+/g, ' ');

// Map: normalized-EN → Set of valid TP translations
const enToTp = new Map();
for (const { tp, en } of corpus) {
  const key = norm(en);
  const set = enToTp.get(key) ?? new Set();
  set.add(tp.trim());
  enToTp.set(key, set);
}

// Collect every (tp, en) pair from village.json
const pairs = [];
const visit = (obj, path) => {
  if (obj == null) return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) visit(obj[i], `${path}[${i}]`);
    return;
  }
  if (typeof obj === 'object') {
    if (typeof obj.tp === 'string' && typeof obj.en === 'string') {
      pairs.push({ tp: obj.tp, en: obj.en, path });
    }
    for (const [k, v] of Object.entries(obj)) visit(v, `${path}.${k}`);
  }
};
visit(village, 'village');

// Single-word TP (from dictionary) is exempt — it's already vetted.
const isSingleWord = (s) => s.trim().split(/\s+/).length === 1;

// Tokenize a sentence into content words for fuzzy matching.
const tokens = (s) => new Set(norm(s).split(' ').filter(Boolean));
const overlap = (a, b) => {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n / Math.max(a.size, b.size);
};

let errors = 0;
for (const { tp, en, path } of pairs) {
  if (isSingleWord(tp)) continue;
  const candidates = enToTp.get(norm(en));
  if (candidates && candidates.has(tp.trim())) continue;

  errors++;
  console.error(`\n[validate-tp] ${path}`);
  console.error(`  EN: "${en}"`);
  console.error(`  TP authored: ${tp}`);
  if (candidates && candidates.size > 0) {
    console.error(`  TP accepted variants for that exact EN:`);
    for (const c of candidates) console.error(`    - ${c}`);
    continue;
  }
  // No exact EN match — suggest the 3 closest Tatoeba EN lines by token overlap
  const enTok = tokens(en);
  const scored = [];
  for (const { tp: t, en: e } of corpus) {
    const s = overlap(enTok, tokens(e));
    if (s > 0) scored.push({ s, tp: t, en: e });
  }
  scored.sort((a, b) => b.s - a.s);
  console.error(`  No exact Tatoeba EN match. Closest authoring targets:`);
  for (const s of scored.slice(0, 3)) {
    console.error(`    EN: "${s.en}"`);
    console.error(`    TP:  ${s.tp}`);
  }
}

if (errors > 0) {
  console.error(
    `\n[validate-tp] ${errors} line(s) not in the canonical corpus. Either rewrite the English to match one of the suggested EN lines, or accept its TP translation. Hand-authored TP is not allowed to ship.`,
  );
  process.exit(1);
}
console.log(`[validate-tp] ✓ all ${pairs.length} pairs canonical`);
