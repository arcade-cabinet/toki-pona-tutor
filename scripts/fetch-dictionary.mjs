#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../src/content/dictionary.json');

const res = await fetch('https://api.linku.la/v1/words?lang=en');
if (!res.ok) {
  console.error(`linku fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const raw = await res.json();

const ALLOWED_TIERS = new Set(['core', 'common']);

const entries = Object.values(raw)
  .filter((w) => !w.deprecated && ALLOWED_TIERS.has(w.usage_category))
  .map((w) => ({
    word: w.word,
    definition: w.translations?.en?.definition ?? '',
    book: w.book,
    usage_category: w.usage_category,
    source_language: w.source_language ?? '',
    ucsur: w.representations?.ucsur ?? '',
    sitelen_emosi: w.representations?.sitelen_emosi ?? '',
  }))
  .sort((a, b) => a.word.localeCompare(b.word));

writeFileSync(outPath, JSON.stringify(entries, null, 2) + '\n');
console.log(`wrote ${entries.length} words to ${outPath}`);
