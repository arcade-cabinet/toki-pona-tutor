#!/usr/bin/env node
/**
 * Build-time dialog translator.
 *
 * Reads src/content/dialog/*.en.json (English authoring format), looks up
 * each English line in the Tatoeba corpus, and writes an augmented
 * src/content/dialog/*.json with the {tp, en} pair attached.
 *
 * If an exact English match is found, that pair is used. If not, the script
 * suggests the 3 closest matches (by word overlap) and fails the build —
 * forcing the author to either copy one of the suggestions or pick a
 * different English phrasing that has a canonical TP translation.
 *
 * This eliminates AI-hallucinated Toki Pona from shipped content.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const corpusPath = resolve(root, 'src/content/corpus/tatoeba.json');
const dialogDir = resolve(root, 'src/content/dialog');
mkdirSync(dialogDir, { recursive: true });

if (!existsSync(corpusPath)) {
  console.error('corpus not found — run: node scripts/fetch-tatoeba-corpus.mjs first');
  process.exit(1);
}

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));

// Build an exact-match index, normalized (lowercase, trimmed, de-punct).
function norm(s) {
  return s.toLowerCase().trim().replace(/[.!?,"'\u2018\u2019\u201c\u201d]/g, '').replace(/\s+/g, ' ');
}

const exactIndex = new Map();
for (const { tp, en } of corpus) {
  const key = norm(en);
  if (!exactIndex.has(key)) exactIndex.set(key, { tp, en });
}

// Word-overlap score for fuzzy matching.
function tokenize(s) {
  return norm(s).split(' ').filter(Boolean);
}

function findClosest(enText, k = 3) {
  const target = new Set(tokenize(enText));
  const scored = [];
  for (const entry of corpus) {
    const words = new Set(tokenize(entry.en));
    let shared = 0;
    for (const w of target) if (words.has(w)) shared++;
    const score = shared / Math.max(target.size, words.size);
    if (score > 0) scored.push({ score, entry });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).map((s) => s.entry);
}

export function translate(enText) {
  const match = exactIndex.get(norm(enText));
  if (match) return { hit: true, tp: match.tp, en: match.en };
  return { hit: false, suggestions: findClosest(enText) };
}

// CLI: validate all dialog files or translate a single phrase
const args = process.argv.slice(2);
if (args.length && args[0] !== '--validate') {
  const phrase = args.join(' ');
  const result = translate(phrase);
  if (result.hit) {
    console.log(`✓ "${result.en}"\n  → ${result.tp}`);
  } else {
    console.log(`✗ No exact match for "${phrase}". Closest:\n`);
    for (const s of result.suggestions) {
      console.log(`  EN: "${s.en}"\n  TP: ${s.tp}\n`);
    }
  }
  process.exit(0);
}

// --validate mode: walk src/content/dialog/*.en.json
const files = readdirSync(dialogDir).filter((f) => f.endsWith('.en.json'));
let errors = 0;
for (const file of files) {
  const inPath = resolve(dialogDir, file);
  const raw = JSON.parse(readFileSync(inPath, 'utf8'));
  if (!Array.isArray(raw.lines)) {
    console.error(`${file}: must have a 'lines' array`);
    errors++;
    continue;
  }
  const outLines = [];
  for (const line of raw.lines) {
    const r = translate(line.en);
    if (!r.hit) {
      console.error(`\n${file} :: "${line.en}"`);
      console.error(`  no exact match. closest:`);
      for (const s of r.suggestions) console.error(`    "${s.en}" → ${s.tp}`);
      errors++;
      continue;
    }
    outLines.push({ ...line, tp: r.tp, en: r.en });
  }
  const outPath = resolve(dialogDir, file.replace('.en.json', '.json'));
  writeFileSync(outPath, JSON.stringify({ ...raw, lines: outLines }, null, 2) + '\n');
  console.log(`✓ ${file} → ${outLines.length} lines translated`);
}
if (errors > 0) {
  console.error(`\n${errors} unresolved line(s). Either rewrite the English or copy a closest match.`);
  process.exit(1);
}
