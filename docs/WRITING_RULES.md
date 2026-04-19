---
title: Writing Rules
updated: 2026-04-19
status: current
domain: creative
---

# Writing Rules for poki soweli

Every user-facing English string (NPC dialogue, signs, narration, combat log, toasts, tutorial beats) must be writable under these rules. The rules exist because **every line has to round-trip through a real toki pona corpus** — we never hand-author TP, we write EN that the corpus can already translate.

If your line fails `pnpm validate-tp`, the problem is almost always that your EN is outside these rules. Rewrite the EN, don't invent TP.

---

## The Corpus

The source of truth is `src/content/corpus/tatoeba.json` — 37,666 TP↔EN sentence pairs from Tatoeba (CC BY 2.0 FR). It characterizes like this:

| Metric | Value |
|---|---|
| Pairs | 37,666 |
| Unique EN tokens | 10,877 |
| Word count p50 / p90 / p99 | **5 / 9 / 18** |
| Coverage of top-1000 words | 85.3% of corpus |
| Coverage of top-2000 words | 91.3% of corpus |
| Sentences with `,` | 8.2% |
| Sentences with `and` | 4.3% |
| Sentences with `because` | **0.4%** |
| Sentences with `which` | **0.3%** |

**Readings**: the corpus is short sentences, mostly single-clause, ending in `.` or `?`. Compound sentences are rare. Rare vocabulary is rare.

The complexity scorer (`pnpm validate-tp`) uses these distributions. A line that scores above the allowed complexity ceiling fails the build with the score broken out by axis so you can see which rule was violated.

---

## Hard Rules (lines that break these fail immediately)

### H1. Length ≤ 9 words
`p90` of the corpus is 9 words. Anything longer is *almost certainly* out-of-corpus. Target 3–7 words. If your line is 10+ words, split it into two beats.

> ❌ "You should probably try fighting the creature before you try catching it."
> ✅ "Fight first. Then catch it."

### H2. End with `.`, `?`, or `!`
The corpus ends 80% `.`, 15% `?`, 3% `!`. No ellipsis, no em-dashes, no quoted dialog within dialog, no trailing commas.

> ❌ "Hmm… maybe."
> ✅ "Maybe."

### H3. Single clause per line
Compound sentences (`because`, `although`, `while`, `which`) are under 1% of the corpus. Use multiple beats instead.

> ❌ "I'm cold because the wind is strong."
> ✅ Beat 1: "I am cold." Beat 2: "The wind is strong."

### H4. No proper nouns except `Tom` or canonical TP names
The corpus leans hard on `Tom` (4,854 occurrences — the Tatoeba everyman). Use `Tom` where you'd use "a person" or a pronoun. All other proper nouns must be the canonical TP spelling (`jan Wawa`, `jan Sewi`, etc.) which the single-word exemption passes through untouched.

> ❌ "Alice fights Bob."
> ✅ "Tom fights."  or  "jan Wawa fights."

### H5. No contractions that the corpus doesn't use
Accepted: `I'm`, `don't`, `you're`, `it's`, `that's`, `can't`. Everything else expand out. The corpus has `dont` and `don't` both (normalized in the validator).

### H6. No meta / fourth-wall language
The TP corpus has no "press A to continue", "menu closed", "error: invalid input". If you need a system message, phrase it as diegetic narration (someone saying it) OR look up what the TP community says (see `docs/agent-briefs/corpus-sources.md`) rather than inventing.

### H7. Toki pona words pass through
Single-token lines and lines that are already pure TP vocabulary (all lowercase TP words, no English function words) are exempted from the corpus check. Example: `"utala!"` or `"mi pona"`. Keep these short and use them like exclamations, not full sentences.

---

## Soft Rules (scored — lines above a threshold fail)

The complexity scorer assigns a **rank 0–100** per line. 0 = trivial, corpus-shaped. 100 = unparseable.

**Build fails at rank > 40** for new content. Legacy content is allowed higher until it's rewritten.

### S1. Vocabulary tier (weight: 35%)
Every content word (excluding `the/a/an/is/are/to/of/in/on/at/and`) gets a rank by its position in the top-2000 EN tokens of the corpus. Out-of-top-2000 words score 100. Out-of-top-1000 score 50. In top-250 score 0.

To pass, **every content word should be in the top 1000**. The top tokens skew concrete: `I you Tom the is a to do have want like can go know think see hear eat go come buy need help love`. Use those.

### S2. Grammatical shape (weight: 25%)
Score based on starter word. Fully-supported starters (rank 0): `I`, `You`, `He`, `She`, `We`, `They`, `Tom`, `The`, `This`, `That`, `It`, `Do`, `Does`, `Did`, `Is`, `Are`, `What`, `Why`, `How`, `Where`, `When`. Starter not in this list: rank 50. Starter is a gerund/participle (`Running...`, `Having...`): rank 70.

### S3. Clause count (weight: 20%)
Single clause: rank 0. Comma present: rank 30. `and` / `but` / `or` as conjunction: rank 40. `because` / `although` / `while` / `which`: rank 70.

### S4. Length fit (weight: 15%)
Words `1–3`: rank 0. `4–6`: rank 0 (the sweet spot). `7–9`: rank 25. `10+`: rank 100 (also blocked by H1).

### S5. Exotic punctuation (weight: 5%)
No `…`, `—`, `;`, `:`, `/`, parentheses, quotes within strings: rank 0. One of those: rank 100.

---

## Recipe: writing within the rules

1. **Start from a corpus search.** Run `grep -i "YOUR IDEA" src/content/corpus/tatoeba.json | head -5`. If matches exist, use one of those EN strings verbatim (or pick an adjacent one).
2. **Default to 3–7 words, single clause, period or question mark.**
3. **Prefer `I/you/Tom/we/the` as the starter.** Match the corpus shape.
4. **When in doubt, use Tom.** Swap any custom character name for `Tom` while drafting.
5. **Multi-beat long thoughts.** If an NPC needs to say something rich, use 3 beats of 4 words each.
6. **Stay inside the top-1000 vocabulary.** The scorer will tell you which word is exotic; pick a simpler synonym.

---

## What to do when the rules don't cover your need

If you need a string that's genuinely outside the corpus (e.g., a UI label, a combat verb), you have three legitimate options:

1. **Rephrase as something the corpus *does* cover.** Usually possible.
2. **Find an additional canonical source** and add it to the corpus pipeline — see `docs/agent-briefs/corpus-sources.md` for the process (must be a published TP↔EN parallel corpus with a compatible license, with attribution recorded in `src/content/corpus/LICENSE.md`).
3. **Drop the string.** If it's a diegetic "what will you do?" prompt, maybe the UI doesn't need words there — a glyph or an icon is more in-world anyway.

**What you cannot do**: hand-author the TP translation. The whole pipeline exists to prevent that. The validator will catch it, and a human reviewer will bounce the PR.

---

## Why these rules exist

Early drafts of the game tried to say what the English wanted to say. The Tatoeba match rate was under 40%. Every PR had 10+ validator failures and the authoring loop was broken.

After characterizing the corpus (see metrics above), the rules collapsed to "write like Tatoeba writes". The match rate jumped past 95% on lines that follow the rules, which means authors stop fighting the validator and start collaborating with it.

The rules are not stylistic preferences — they are **what the corpus can actually translate**. Fighting them means fighting reality. If you want a different voice, bring a different corpus.
