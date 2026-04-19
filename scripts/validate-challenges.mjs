#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const dictionary = JSON.parse(readFileSync(resolve(root, 'src/content/dictionary.json'), 'utf8'));
const challenges = JSON.parse(readFileSync(resolve(root, 'src/content/challenges.json'), 'utf8'));

const dictionarySet = new Set(dictionary.map((w) => w.word));
const errors = [];

challenges.forEach((challenge, idx) => {
  const label = `Challenge ${idx + 1} ("${challenge.prompt}")`;

  if (!Array.isArray(challenge.target) || challenge.target.length === 0) {
    errors.push(`${label}: target must be a non-empty array`);
    return;
  }

  for (const word of challenge.target) {
    if (!dictionarySet.has(word)) {
      errors.push(`${label}: target word "${word}" is not in dictionary.json`);
    }
  }

  // Grammar smoke checks — catches the most common authoring mistakes.
  const target = challenge.target;
  const subject = target[0];
  const hasLi = target.includes('li');

  // Rule: "li" is forbidden when subject is mi/sina and it's the only subject.
  if ((subject === 'mi' || subject === 'sina') && hasLi) {
    errors.push(
      `${label}: subject "${subject}" should not take "li" (mi/sina drop li before the verb)`
    );
  }

  // Rule: "e" cannot be sentence-initial or adjacent to itself.
  if (target[0] === 'e') {
    errors.push(`${label}: "e" cannot start a sentence`);
  }
  if (target[0] === 'li') {
    errors.push(`${label}: "li" cannot start a sentence`);
  }

  // Rule: no two identical particles adjacent.
  for (let i = 1; i < target.length; i++) {
    if (target[i] === target[i - 1] && (target[i] === 'li' || target[i] === 'e')) {
      errors.push(`${label}: duplicate adjacent particle "${target[i]}"`);
    }
  }
});

if (errors.length > 0) {
  console.error('✗ Challenge validation failed:\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}

console.log(`✓ Validated ${challenges.length} challenges against ${dictionary.length} dictionary words.`);
