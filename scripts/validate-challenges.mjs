#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const clues = JSON.parse(readFileSync(resolve(root, 'src/content/clues.json'), 'utf8'));
const challenges = JSON.parse(readFileSync(resolve(root, 'src/content/challenges.json'), 'utf8'));

const clueSet = new Set(clues.map((entry) => entry.id));
const errors = [];

challenges.forEach((challenge, idx) => {
  const label = `Challenge ${idx + 1} ("${challenge.prompt}")`;

  if (!Array.isArray(challenge.target) || challenge.target.length === 0) {
    errors.push(`${label}: target must be a non-empty array`);
    return;
  }

  for (const clueId of challenge.target) {
    if (!clueSet.has(clueId)) {
      errors.push(`${label}: target clue "${clueId}" is not in clues.json`);
    }
  }
});

if (errors.length > 0) {
  console.error('✗ Challenge validation failed:\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}

console.log(`✓ Validated ${challenges.length} challenges against ${clues.length} curated clues.`);
