---
title: Rivers Reckoning — Writing Rules
updated: 2026-04-23
status: current
domain: creative
---

# Writing Rules

Rivers Reckoning is now native-English. The old translation/corpus layer has been removed, so writers should optimize for story clarity, quest richness, and kid-friendly fantasy tone instead of translation compatibility.

## Voice

-   Write for a young player: direct, vivid, and never cruel.
-   Prefer concrete fantasy detail over abstract lore exposition.
-   Keep combat feedback short enough to read while playing.
-   Give each NPC one clear purpose: guidance, flavor, quest, shop, or gate.
-   Use the name Rivers when the scene benefits from personal stakes.

## Quest Copy

-   A quest offer must state what the player should do and why it matters.
-   A quest summary should be one sentence.
-   A reward line should be plain English: item, XP, and optional clue.
-   A region-master line should make the gate feel like a local challenge, not a generic boss.

## Clues

Curated investigation clues live in `src/content/clues.json`. Use clues for durable discoveries, quest rewards, and exportable field-log progress. Do not use clues as a language-learning replacement; they are story and fieldcraft notes.

When adding a clue:

-   Use a stable kebab-case `id`.
-   Use a short title-cased `label`.
-   Keep `summary` to one sentence.
-   Choose a `category` such as `story`, `quest`, `fieldcraft`, `combat`, `badge`, `gear`, or `ending`.
-   Choose an `icon` that reads clearly on mobile.

## Do Not Reintroduce

-   No translation-gated authoring.
-   No external sentence corpus.
-   No language-learning quests.
-   No user-facing glossary-as-gameplay mechanic.
