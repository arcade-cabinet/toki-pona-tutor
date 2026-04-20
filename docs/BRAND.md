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

**Warm cream + parchment foundation** with emerald + amber accents. Animal-Crossing / Stardew / Spiritfarer energy — cozy Sunday morning, not edgy, not gamer, not neon. The Fan-tasy sprite palette reads clearly on cream backdrops without fighting the chrome.

Authoritative tokens live as CSS custom properties in `src/styles/brand.css`. Anywhere in the codebase referring to color, reference these names — never raw hex.

### Warm neutrals — foundation

| Token                      | Hex       | Role |
|----------------------------|-----------|------|
| `--poki-cream`             | `#fdf6e3` | Body background wash, parchment fields |
| `--poki-parchment`         | `#f5e6c5` | Dialog boxes, HUD backdrops, cards |
| `--poki-parchment-deep`    | `#e8d5a8` | Hover / pressed parchment |
| `--poki-border`            | `#c8a96b` | Panel + dialog-frame amber border (warm, not cold gray) |
| `--poki-ink`               | `#3d2e1e` | Primary text — not pure black, too harsh |
| `--poki-ink-soft`          | `#6b5940` | Secondary text, labels |

### Brand accents — from `ma pona` (the good land)

| Token                  | Hex       | Role |
|------------------------|-----------|------|
| `--poki-emerald`       | `#4a9d5a` | Primary action; `kasi`/plants; health |
| `--poki-emerald-deep`  | `#327144` | Pressed emerald, dialog-glyph fill |
| `--poki-amber`         | `#e8a04a` | Secondary action, highlights |
| `--poki-amber-deep`    | `#c87a26` | Pressed amber |
| `--poki-peach`         | `#f4b995` | Affection / cute highlight, jan Sewi vibe |

### Type accents — five elements

| Token          | Hex       | Meaning |
|----------------|-----------|---------|
| `--poki-seli`  | `#e8553e` | Fire — warm red-orange, never harsh |
| `--poki-telo`  | `#4da3d4` | Water — soft blue, not neon |
| `--poki-kasi`  | `#6fb35c` | Plant — soft green |
| `--poki-lete`  | `#b8d4dc` | Cold — pale icy cream-blue |
| `--poki-wawa`  | `#d4a84e` | Lightning/strong — warm gold |

### Status

| Token            | Hex       | Role |
|------------------|-----------|------|
| `--poki-joy`     | `#f2c158` | Catch success, level-up, celebration toasts |
| `--poki-caution` | `#d98a3f` | Hint toasts, warnings (not errors) |
| `--poki-danger`  | `#c85a4a` | Low HP, defeat — muted red, never bright |

### Sky tints — biome backdrops

| Token               | Hex       | Biome |
|---------------------|-----------|-------|
| `--poki-sky-day`    | `#a8d8e8` | Grass, forest |
| `--poki-sky-peak`   | `#6b7a83` | Mountain |
| `--poki-sky-cold`   | `#c4d8e8` | Ice |

### Semantic aliases

| Alias             | Maps to                   | When to use |
|-------------------|---------------------------|-------------|
| `--background`    | `--poki-cream`            | Body / app-shell backdrop |
| `--surface`       | `--poki-parchment`        | Panel + dialog backgrounds |
| `--surface-high`  | `--poki-parchment-deep`   | Hovered / pressed surfaces |
| `--border`        | `--poki-border`           | All borders, default |
| `--text`          | `--poki-ink`              | Body text, headings |
| `--text-mute`     | `--poki-ink-soft`         | Secondary labels, hints |
| `--primary`       | `--poki-emerald`          | Primary buttons, CTA |
| `--primary-deep`  | `--poki-emerald-deep`     | Pressed primary |
| `--secondary`     | `--poki-amber`            | Secondary buttons, highlights |
| `--secondary-deep`| `--poki-amber-deep`       | Pressed secondary |
| `--success`       | `--poki-emerald`          | Positive feedback (pona, catch success) |
| `--danger`        | `--poki-danger`           | Low-HP warning, error state |
| `--info`          | `--poki-telo`             | Neutral info, cooldown timers |
| `--accent`        | `--poki-amber`            | XP gain, "new" badges |

### Anti-patterns

- **No pure black or white.** Ink is `#3d2e1e`, parchment is `#f5e6c5`. Pure black screams at kids; pure white flickers on OLED.
- **No neon.** Saturation cap around the five type accents. Brighter = bad.
- **No gray borders.** Always a warm amber line (`--poki-border`), never cold gray.
- **No cold shadows.** All shadows use `rgba(61, 46, 30, α)` (warm ink), never `rgba(0,0,0,α)`.
- **No glass-morphism / backdrop-blur** on mobile. Kills perf, looks like a web app, not a game world.
- **No CRT scanlines / pixel-perfect postprocessing.** The game world has pixel art; the chrome is clean.

### HP bar threshold

Three-stop by percentage, each a solid color (no gradient interpolation — the color jump IS the feedback signal):

- **> 50% HP**: `--poki-emerald`
- **20–50% HP**: `--poki-caution`
- **< 20% HP**: `--poki-danger`, pulses via `animation` on opacity 0.65 ↔ 1.0 at 1Hz

## Typography

Self-hosted via `src/styles/fonts.css`. No CDN, no Google-Fonts runtime fetch. All four families ship under SIL Open Font License 1.1 with `OFL.txt` alongside each `.woff2` in `public/assets/fonts/`. Variable fonts for body/display/mono; one static OTF for sitelen-pona.

| Role                      | Face            | Token             | Size (desktop / mobile) |
|---------------------------|-----------------|-------------------|-------------------------|
| Body / dialog / descriptions | Nunito       | `--font-body`     | 18px / 16px             |
| Display / headings / toasts | Fredoka       | `--font-display`  | 24px / 20px             |
| Numbers (HP, XP, level, tabular) | JetBrains Mono | `--font-mono`  | 16px / 14px             |
| sitelen-pona glyphs (UCSUR) | nasin-nanpa 4.0.2 UCSUR | `--font-glyph` | glyph-dependent |

- **Nunito** — rounded, warm, highly readable on small screens. Variable weight 200-900.
- **Fredoka** — rounded, friendly, playful without being childish. Variable weight 300-700 + width 75-125%.
- **JetBrains Mono** — clean fixed-width digits, not a "code" feel. Variable weight 100-800.
- **nasin-nanpa** — ETBCOR's standard UCSUR sitelen-pona hieroglyph font; renders codepoints U+F1900 and up.

Ligatures **off** by default. Tabular-nums **on** for any counter or timer. Line-height 1.45 for prose; 1.15 for HUD.

No all-caps outside small labels. Kids read lowercase faster; all-caps screams at them.

**Never used**: Kenney Pixel, Kenney Mini Square, Inter, Cinzel, Fairfax, or any pixel/retro display font. Pixel fonts fight readability on phone screens and communicate "video game" instead of "cozy book." The sitelen-pona glyphs are all the "this is a different world" we need.

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
   minimum on every touchable. **Tap-to-walk** is the primary movement
   input — tap a tile, the lead walks there (4-way grid, no diagonals).
   No persistent virtual d-pad or A/B button cluster; this game is not
   a handheld emulator. Interactions come to the player as a contextual
   hint glyph that follows the sprite. The full HUD + input spec lives
   in `docs/UX.md`.
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

### Overworld HUD

Top bar: **status strip** pinned top-left (lead portrait + name + HP
bar + level + mastered-words tally) + **hamburger** pinned top-right.
A **contextual hint glyph** (`toki` / `tawa` / `alasa` / `poki` /
`kama` / `utala`) follows the player sprite in world-space whenever
an interactable is adjacent. No persistent action buttons. Full spec
in `docs/UX.md`.

### Pause overlay

Slide-in from right, summoned by the top-right hamburger. Full-width
sheet on phones; ~420px side panel on tablets + desktop with the world
canvas visible behind at reduced opacity. Four routes tabbed:
**Party** (sitelen `soweli`), **Vocab** (sitelen `nasin` / T3-13),
**Inventory** (sitelen `ijo` — badges, beat progress, items),
**Settings** (sitelen `awen` / T3-06). Plus a Save row + Quit row at
the bottom. Back-button / swipe-right / Escape / tap-outside all
dismiss. Highlighted tab uses `--poki-emerald` border + `--poki-emerald-deep`
fill at 20% alpha. Action labels are single TP words in 20px Inter.

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
