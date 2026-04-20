---
title: Brand & UI/UX Guidelines
updated: 2026-04-20
status: current
domain: product
---

# poki soweli — Brand & UI/UX Guidelines

The one-stop reference when building any user-facing surface: pause
menu, settings screen, combat HUD, dialog bubble, share card, store
page, social preview.

If you're styling something and there isn't an answer here, **pick the
closest existing pattern and extend it here**. Keep this doc aligned
with what's shipping; when the visual system drifts, update this first,
then fix the code.

## Identity

- **Name**: poki soweli (all lowercase, always). TP: "creature net."
- **Genre**: monster-catching RPG with Final-Fantasy × catch-and-train
  mechanics. Every monster is catchable.
- **Audience**: kids, roughly 7–12, learning toki pona incidentally by
  playing. Also works for adult language-nerds. Not punishing; no
  permadeath; no wasted time.
- **Voice**: fierce-but-friendly. "Dread knight" > "death knight."
  Short, imperative copy. Kid-safe but never cutesy-infantilizing.
- **Language**: every user-facing TP string round-trips through the
  Tatoeba corpus. English copy is functional only. See
  `docs/WRITING_RULES.md`.

## Color palette

Parchment-on-dark with kasi-green highlights. Evokes old RPG manuals
and weathered scrolls; warm enough to feel welcoming, dark enough that
the Fan-tasy sprite palette reads clearly on top.

### Canonical colors

| Token              | Hex       | Role |
|--------------------|-----------|------|
| `--poki-ink`       | `#1b1510` | Body background — deep coffee-brown, near-black |
| `--poki-bark`      | `#2d2318` | Surface (panels, modals) |
| `--poki-wood`      | `#4e3e2a` | Surface-raised (buttons, hover) |
| `--poki-parchment` | `#f5e6c8` | Primary text — warm off-white |
| `--poki-parchment-mute` | `#c9a268` | Secondary text, borders, icon outlines |
| `--poki-kasi`      | `#86a856` | Kasi-green accent (type `kasi` + general success) |
| `--poki-kasi-glow` | `#a7c472` | Hover/active for kasi-green |
| `--poki-seli`      | `#c23b22` | Seli-red (fire / HP danger / error) |
| `--poki-telo`      | `#5b94a6` | Telo-blue (water / info / cooldown) |
| `--poki-lete`      | `#9cc9d6` | Lete-ice (accent for cold biomes + frozen status) |
| `--poki-wawa`      | `#b38a3e` | Wawa-amber (strong type + warnings + XP glow) |
| `--poki-moli`      | `#6b3d6d` | Moli-violet (undead / special-move flash) |

### Semantic aliases

| Alias          | Maps to             | When to use |
|----------------|---------------------|-------------|
| `surface`      | `--poki-bark`       | Panel backgrounds |
| `surface-high` | `--poki-wood`       | Raised surfaces, hovered buttons |
| `border`       | `--poki-parchment-mute` | All borders, default |
| `text`         | `--poki-parchment`  | Body text, headings |
| `text-mute`    | `--poki-parchment-mute` | Secondary labels, hints |
| `success`      | `--poki-kasi`       | Positive feedback (pona, catch success) |
| `danger`       | `--poki-seli`       | HP-low warning, errors (ike) |
| `info`         | `--poki-telo`       | Neutral info, cooldown timers |
| `accent`       | `--poki-wawa`       | XP gain, highlights, "new" badges |

### HP bar gradient

Three-stop by percentage:

- **> 50% HP**: `--poki-kasi` (green) solid
- **20–50% HP**: `--poki-wawa` (amber) solid
- **< 20% HP**: `--poki-seli` (red) solid, with a slow 2Hz pulse via CSS
  `animation` on opacity 0.7 ↔ 1.0.

Never transition through intermediate hues mid-animation — the color
jump is the feedback signal, not a continuous fade.

## Typography

| Role                   | Face                      | Size (desktop / mobile) |
|------------------------|---------------------------|-------------------------|
| Body / dialog          | Inter (fallback: system)  | 18px / 16px             |
| Dialog speaker label   | Inter SemiBold            | 14px / 12px             |
| HUD numbers (HP, XP, level) | Inter tabular-nums   | 16px / 14px             |
| Section headers        | Cinzel (fallback: serif)  | 24px / 20px             |
| sitelen-pona glyph row | Fairfax (reserve font)    | glyph-dependent         |

Ligatures **off** by default. Tabular-nums **on** for any counter or
timer. Line-height 1.45 for prose; 1.15 for HUD.

No all-caps outside section headers. Kids read lowercase faster;
all-caps screams at them.

## Spacing & layout

8-point grid. Every padding, margin, gap is a multiple of 8. Exceptions
for border-only 1/2px never stack into the grid.

### Touch targets

Minimum 44×44dp per WCAG 2.1. Action buttons in combat menus pad to
56×56dp so a kid with short thumbs hits them reliably.

### Panel rhythm

| Element          | Radius | Border     | Shadow                           |
|------------------|--------|------------|----------------------------------|
| Root modal       | 16px   | 2px solid `--border` | `0 12px 28px rgba(0,0,0,0.4)` |
| Panel            | 12px   | 1px solid `--border` | `0 4px 10px rgba(0,0,0,0.25)` |
| Button (rest)    | 8px    | 1px solid `--border` | none |
| Button (hover)   | 8px    | 1px solid `--poki-kasi` | `0 0 0 2px rgba(134,168,86,0.3)` |

Dialog bubbles: 16px radius on the non-tail corners, 4px on the
tail-pointer corner so the pointer reads as continuous.

## Motion

| Action             | Duration | Easing       | Notes |
|--------------------|----------|--------------|-------|
| Menu open/close    | 200ms    | `ease-out`   | Scale + fade combined |
| Button press       | 120ms    | `ease-out`   | Translate-y 2px + shadow shrink |
| HP damage tween    | 400ms    | `ease-in-out`| Separate from color stop change |
| Victory toast      | 300ms in, 2.5s hold, 400ms out | `ease-out` / `linear` / `ease-in` | Stack bottom-up |
| Dialog text reveal | speed = `textSpeed` pref (default 48 cps); 0 = instant |
| Level-up flash     | 600ms    | `ease-out`   | Yellow glow fades on the party sprite |

Respect `prefers-reduced-motion: reduce` — fade, don't slide.

## UI/UX principles

These are the "settle arguments when two designers disagree" defaults.
Listed in order of precedence — earlier rules win.

1. **Diegetic over didactic.** Teach through the world, never a tutorial
   modal. jan Sewi hands you a poki; the game doesn't narrate that
   *she handed you a poki*.
2. **Legibility over depth.** If the player can't tell what happened,
   the feature is broken regardless of correctness. HP tweens, damage
   numbers pop, type multipliers flash in their type color.
3. **Kid audience over all else.** Close calls go kid-friendly. Fierce,
   never scary. No filibuster tutorials. No wasted time.
4. **Consistent playing pieces.** Fan-tasy tilesets + curated sprite
   sheets only. Never mix art styles. See `docs/STANDARDS.md`
   "Tonal consistency."
5. **TP first; English is a fallback.** Buttons labeled with TP
   dictionary words when semantically meaningful (`awen` for save,
   `kama` for load). English where TP would be contrived (raw numbers,
   date stamps, slot indices).
6. **Persistence is quiet.** Autosaves flash a tiny indicator — never a
   modal. Manual save asks once with a TP verb, never confirms twice.
7. **Mobile is a first-class surface, not an afterthought.** 44×44dp
   minimum on every touchable. Virtual d-pad in the bottom-left with
   thumb reach in mind.
8. **Accessibility is default-on.** `prefers-reduced-motion`,
   `prefers-color-scheme: dark` (we only do dark; light mode is out
   of scope), high-contrast setting toggles doubled border weights +
   flattened gradients.

## Chrome patterns

### Dialog bubble (overworld + combat)

```
┌──────────────────────────────────────────┐
│ jan Sewi                                 │  <- speaker label, 14px mute
├──────────────────────────────────────────┤
│                                          │
│  sina kama. ni li pona.                  │  <- body, 18px text
│  o jo e poki.                            │
│                                          │
│  ▾                                       │  <- advance indicator, 0.8 Hz bob
└──────────────────────────────────────────┘
```

- Speaker label required when an NPC speaks; omitted for inner
  monologue (prompts like "sina kama" unattributed).
- Advance indicator shows when `showText` is awaiting input; hidden
  during reveal animation.
- Sitelen-pona overlay (T8-04) replaces the speaker label row with a
  glyph row when the pref is on.

### Pause menu

Four-item vertical list: `nimi` (vocabulary / T3-13), `poki` (inventory
+ badges / T3-09), `awen` (save / T3-05), `tawa` (back to field).
Highlighted row uses `--poki-kasi` border + `--poki-kasi-glow` fill at
20% alpha. Action labels are single TP words in 20px Inter.

### Combat HUD (top-of-screen)

Left cluster: creature sprite 48×48 (frozen `idle` frame), name_tp
(14px), level (14px tabular).
Center cluster: HP bar 200×12 with gradient-by-threshold (see §HP).
Right cluster: status chips stacked right-to-left (burn, wet, frozen
icons, 20×20).

### Victory toast

Bottom-anchored, 16px from bottom edge, stacks bottom-up when multiple
fire. Max 3 visible; older ones slide off-screen. Background uses
`--poki-wawa` with `--text` text (high contrast). Each toast holds
2.5s then self-dismisses.

## Reference implementations

When a new surface is built, point it at the matching reference:

| Surface                | Lives at |
|------------------------|----------|
| Plain showText dialog  | `src/modules/main/dialog.ts` + RPG.js default |
| Choice prompt          | `player.showChoices` — use TP labels |
| Pause vocabulary       | `src/modules/main/vocabulary-screen.ts` |
| Pause inventory        | `src/modules/main/inventory-screen.ts` |
| Pause save slots       | `src/modules/main/save-menu.ts` |
| Dictionary export card | `src/modules/main/dictionary-export.ts` (text + SVG) |

## Out of scope for v0.2

- Full Vue GUI chrome (combat panel, party detail card) — blocked on
  RPG.js v5 Vue surface stabilizing.
- Theme switching (light mode, custom palettes).
- Localized EN — the game is diegetic TP. Store-page copy can be
  localized to other human languages, but in-game EN stays fixed.
- Animated sitelen-pona glyphs — static rendering only, even in the
  share card.

## See also

- `docs/DESIGN.md` — product identity + principles
- `docs/STANDARDS.md` — code, content, asset non-negotiables
- `docs/LORE.md` — world + character canon
- `docs/GLOSSARY.md` — TP word roles + frequency
- `docs/WRITING_RULES.md` — authoring EN strings for Tatoeba
