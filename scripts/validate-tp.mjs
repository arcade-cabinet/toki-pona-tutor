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
const vocabPath = resolve(root, 'src/content/corpus/en-top2000.json');
const spineDir = resolve(root, 'src/content/spine');
const legacyVillagePath = resolve(root, 'src/content/village.json');

if (!existsSync(corpusPath)) {
  console.error('[validate-tp] corpus missing — run scripts/fetch-tatoeba-corpus.mjs');
  process.exit(1);
}

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
const topVocab = existsSync(vocabPath) ? JSON.parse(readFileSync(vocabPath, 'utf8')) : [];
const vocabRank = new Map();
for (let i = 0; i < topVocab.length; i++) vocabRank.set(topVocab[i], i);

/**
 * Score an EN line against the writing rules (docs/WRITING_RULES.md).
 * Returns { rank, reasons[] } where rank is 0..100 — the build fails
 * non-legacy lines with rank > 40. Reasons carry a human-readable
 * breakdown so authors can see which axis pushed them over.
 */
const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of',
  'in', 'on', 'at', 'and', 'or', 'but', 'not', 'no', 'do', 'does', 'did',
  'have', 'has', 'had', 'my', 'your', 'his', 'her', 'their', 'our', 'its',
  'it', 'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'them', 'us',
  'this', 'that', 'these', 'those', 'for', 'from', 'with', "i'm", "don't",
  "you're", "it's", "that's", "can't", "i've",
]);
const GOOD_STARTERS = new Set([
  'i', 'you', 'he', 'she', 'we', 'they', 'tom', 'the', 'this', 'that',
  'it', 'do', 'does', 'did', 'is', 'are', 'was', 'were', 'what', 'why',
  'how', 'where', 'when', 'who', "i'm", "you're", "it's", "don't",
]);
const EXOTIC_PUNCT = /[\u2026\u2014;:/()\u201c\u201d]/;

function scoreLine(en) {
  const reasons = [];
  const trimmed = en.trim();
  const words = trimmed.toLowerCase().replace(/[.!?,"'\u2018\u2019\u201c\u201d]/g, '').split(/\s+/).filter(Boolean);
  const n = words.length;

  // S1 vocabulary tier — weight 35
  const content = words.filter((w) => !FUNCTION_WORDS.has(w));
  let vocabScore = 0;
  if (content.length > 0 && vocabRank.size > 0) {
    let sum = 0;
    const worst = [];
    for (const w of content) {
      const r = vocabRank.get(w);
      let ws;
      if (r === undefined) ws = 100;
      else if (r < 250) ws = 0;
      else if (r < 1000) ws = 15;
      else ws = 50;
      if (ws >= 50) worst.push(w);
      sum += ws;
    }
    vocabScore = sum / content.length;
    if (worst.length > 0) reasons.push(`rare words: ${worst.slice(0, 4).join(', ')}`);
  }

  // S2 starter shape — weight 25
  const starter = words[0] ?? '';
  let starterScore = 0;
  if (starter.endsWith('ing')) {
    starterScore = 70;
    reasons.push(`gerund starter "${starter}"`);
  } else if (!GOOD_STARTERS.has(starter)) {
    starterScore = 50;
    reasons.push(`uncommon starter "${starter}"`);
  }

  // S3 clause count — weight 20
  let clauseScore = 0;
  const lc = trimmed.toLowerCase();
  if (/\b(because|although|while|which|whom|whose)\b/.test(lc)) {
    clauseScore = 70;
    reasons.push('subordinate clause');
  } else if (/\b(and|but|or)\b/.test(lc)) {
    clauseScore = 40;
    reasons.push('compound clause');
  } else if (trimmed.includes(',')) {
    clauseScore = 30;
    reasons.push('comma (likely multi-clause)');
  }

  // S4 length fit — weight 15
  let lenScore = 0;
  if (n >= 10) {
    lenScore = 100;
    reasons.push(`length ${n} words (p99=18, target ≤ 9)`);
  } else if (n >= 7) lenScore = 25;

  // S5 exotic punctuation — weight 5
  let punctScore = 0;
  if (EXOTIC_PUNCT.test(trimmed)) {
    punctScore = 100;
    reasons.push('exotic punctuation (…—;:/())');
  }

  const rank = Math.round(
    vocabScore * 0.35 + starterScore * 0.25 + clauseScore * 0.20 + lenScore * 0.15 + punctScore * 0.05,
  );
  return { rank, reasons };
}

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

/**
 * Files the validator reports on but does not block the build over. Used
 * during the pivot from hand-authored content to the declarative pipeline:
 * legacy files stay visible (so contributors know they're lying) without
 * breaking the build before their engine-side consumer is rewired.
 *
 * When a legacy file's consumer is removed, its path is removed from here
 * and the file itself is deleted in the same PR.
 */
const LEGACY_PATHS = new Set([
  'src/content/village.json',
]);

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

const COMPLEXITY_CEILING = 40;
let errors = 0;
let legacyWarnings = 0;
let checked = 0;
let complexityFlags = 0;

for (const file of scanFiles) {
  const rel = file.replace(`${root}/`, '');
  const body = JSON.parse(readFileSync(file, 'utf8'));
  const pairs = [];
  collectPairs(body, rel, pairs);
  const isLegacy = LEGACY_PATHS.has(rel);
  for (const { tp, en, path } of pairs) {
    const isSingleWord = /^\S+$/.test(en);
    if (isSingleWord) continue;
    checked++;
    const candidates = enToTp.get(norm(en));

    const bucket = isLegacy ? 'legacy' : 'blocking';

    const countViolation = () => {
      if (bucket === 'legacy') legacyWarnings++;
      else errors++;
    };

    // Score against the writing rules. Lines over the ceiling fail even if
    // they coincidentally have a corpus match — the rules exist so authors
    // stop writing out-of-corpus EN. Legacy files get a warning.
    const { rank, reasons } = scoreLine(en);
    if (rank > COMPLEXITY_CEILING) {
      if (bucket === 'blocking') {
        errors++;
        complexityFlags++;
        console.error(`\n[validate-tp] COMPLEXITY ${path} (rank ${rank}/100)`);
        console.error(`  EN: "${en}"`);
        if (reasons.length > 0) console.error(`  ${reasons.join('; ')}`);
        console.error(`  See docs/WRITING_RULES.md — target rank ≤ ${COMPLEXITY_CEILING}.`);
        // Don't also report a corpus miss for the same line — the author
        // needs to rewrite the EN first, then the corpus check will re-run.
        continue;
      } else {
        legacyWarnings++;
        complexityFlags++;
      }
    }

    if (!tp) {
      // pre-translation pair — succeeds if any TP exists for this EN
      if (!candidates || candidates.size === 0) {
        countViolation();
        console.error(`\n[validate-tp] ${bucket === 'legacy' ? 'LEGACY-WARN' : 'ERROR'} ${path}`);
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
    countViolation();
    console.error(`\n[validate-tp] ${bucket === 'legacy' ? 'LEGACY-WARN' : 'ERROR'} ${path}`);
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

if (legacyWarnings > 0) {
  console.warn(
    `\n[validate-tp] ${legacyWarnings} legacy violation(s) reported but not blocking the build — scheduled for removal when their engine-side consumer is rewired. See LEGACY_PATHS in this script.`,
  );
}

if (errors > 0) {
  console.error(
    `\n[validate-tp] ${errors}/${checked} line(s) failed. Either (a) rewrite the English to match an accepted Tatoeba pair, or (b) accept one of the suggested TP translations verbatim. Hand-authored TP cannot ship.`,
  );
  process.exit(1);
}
console.log(
  `[validate-tp] ✓ ${checked} multi-word translatable(s) canonical across ${scanFiles.length} file(s)` +
    (complexityFlags > 0 ? ` (${complexityFlags} complexity warning${complexityFlags === 1 ? '' : 's'} in legacy files)` : ''),
);
