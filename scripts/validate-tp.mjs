#!/usr/bin/env node
/**
 * Validate every translatable field in authored content against the vendored
 * Tatoeba corpus. Fails with suggested replacements if any EN string has no
 * canonical TP pair.
 *
 * Sources scanned:
 *   - src/content/spine/**.json (authored content, post-pivot source of truth)
 *   - src/content/village.json (legacy, will be removed once spine is the only source)
 *
 * Single-word EN values are exempt — the dictionary is pre-vetted.
 *
 * This is the prebuild gate. Hand-authored Toki Pona cannot ship.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const corpusPath = resolve(root, 'src/content/corpus/tatoeba.json');
const spineDir = resolve(root, 'src/content/spine');
const legacyVillagePath = resolve(root, 'src/content/village.json');

if (!existsSync(corpusPath)) {
  console.error('[validate-tp] corpus missing — run scripts/fetch-tatoeba-corpus.mjs');
  process.exit(1);
}

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));

const norm = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[.!?,"'\u2018\u2019\u201c\u201d]/g, '')
    .replace(/\s+/g, ' ');

/** normalized-EN → Set of valid TP translations from the corpus */
const enToTp = new Map();
for (const { tp, en } of corpus) {
  const key = norm(en);
  const set = enToTp.get(key) ?? new Set();
  set.add(tp.trim());
  enToTp.set(key, set);
}

const tokens = (s) => new Set(norm(s).split(' ').filter(Boolean));
function closest(enText, k = 3) {
  const t = tokens(enText);
  const scored = [];
  for (const entry of corpus) {
    const u = tokens(entry.en);
    let shared = 0;
    for (const w of t) if (u.has(w)) shared++;
    const score = shared / Math.max(t.size, u.size);
    if (score > 0) scored.push({ score, entry });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map((s) => s.entry);
}

/** Collect { tp, en, path } triples from a parsed JSON tree. */
function collectPairs(obj, trail, out) {
  if (obj == null) return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) collectPairs(obj[i], `${trail}[${i}]`, out);
    return;
  }
  if (typeof obj === 'object') {
    if (typeof obj.en === 'string') {
      out.push({ en: obj.en, tp: typeof obj.tp === 'string' ? obj.tp : undefined, path: trail });
    }
    for (const [k, v] of Object.entries(obj)) collectPairs(v, `${trail}.${k}`, out);
  }
}

/** @returns list of absolute paths to *.json files under `dir`. */
function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const visit = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) visit(p);
      else if (entry.isFile() && p.endsWith('.json')) out.push(p);
    }
  };
  visit(dir);
  return out;
}

const scanFiles = [...walk(spineDir)];
if (existsSync(legacyVillagePath)) scanFiles.push(legacyVillagePath);

if (scanFiles.length === 0) {
  console.log('[validate-tp] no content to validate yet (spine + legacy village.json both empty)');
  process.exit(0);
}

let errors = 0;
let checked = 0;

for (const file of scanFiles) {
  const rel = file.replace(`${root}/`, '');
  const body = JSON.parse(readFileSync(file, 'utf8'));
  const pairs = [];
  collectPairs(body, rel, pairs);
  for (const { tp, en, path } of pairs) {
    const isSingleWord = /^\S+$/.test(en);
    if (isSingleWord) continue;
    checked++;
    const candidates = enToTp.get(norm(en));

    if (!tp) {
      // pre-translation pair — succeeds if any TP exists for this EN
      if (!candidates || candidates.size === 0) {
        errors++;
        console.error(`\n[validate-tp] ${path}`);
        console.error(`  EN: "${en}"`);
        console.error(`  No canonical TP pair exists. Rewrite to one of:`);
        for (const c of closest(en, 3)) {
          console.error(`    EN: "${c.en}"`);
          console.error(`    TP:  ${c.tp}`);
        }
      }
      continue;
    }

    if (candidates && candidates.has(tp.trim())) continue;
    errors++;
    console.error(`\n[validate-tp] ${path}`);
    console.error(`  EN: "${en}"`);
    console.error(`  TP authored: ${tp}`);
    if (candidates && candidates.size > 0) {
      console.error(`  Accepted TP variants for this EN:`);
      for (const c of candidates) console.error(`    - ${c}`);
    } else {
      console.error(`  No canonical TP for this EN. Closest rewrites:`);
      for (const c of closest(en, 3)) {
        console.error(`    EN: "${c.en}"`);
        console.error(`    TP:  ${c.tp}`);
      }
    }
  }
}

if (errors > 0) {
  console.error(
    `\n[validate-tp] ${errors}/${checked} line(s) failed. Either (a) rewrite the English to match an accepted Tatoeba pair, or (b) accept one of the suggested TP translations verbatim. Hand-authored TP cannot ship.`,
  );
  process.exit(1);
}
console.log(`[validate-tp] ✓ ${checked} multi-word translatable(s) canonical across ${scanFiles.length} file(s)`);
