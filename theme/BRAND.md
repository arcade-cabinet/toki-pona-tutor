---
title: Toki Town brand identity
updated: 2026-04-19
status: current
domain: product
---

# Toki Town brand

**Warm and cute, not 2play.** Think cozy Sunday morning, warm bread, a friend
teaching you a word you didn't know. Not edgy, not gamer, not dark, not
neon, not "epic". Animal Crossing / Stardew / Spiritfarer energy, not
gacha / raid / tactical / roguelike energy.

## Color palette

Authoritative tokens. Anywhere in the codebase referring to color, reference
these names — never raw hex literals. Defined in GDScript at
`res://theme/palette.gd` as a static class with typed Color fields, and
mirrored as StyleBox resources in `res://theme/`.

### Warm neutrals (foundation)

| Token | Hex | Use |
|-------|-----|-----|
| `cream` | `#FDF6E3` | Background wash for UI panels, parchment fields |
| `parchment` | `#F5E6C5` | Dialog boxes, HUD backdrops, cards |
| `parchment_deep` | `#E8D5A8` | Hover / pressed states of parchment |
| `warm_border` | `#C8A96B` | Border around panels, dialog frames |
| `ink` | `#3D2E1E` | Primary text color (not pure black — too harsh) |
| `ink_soft` | `#6B5940` | Secondary text, labels, subtle UI |

### Brand accents (from ma pona — the good land)

| Token | Hex | Use |
|-------|-----|-----|
| `emerald` | `#4A9D5A` | Primary action color — kasi (plants), health, grass |
| `emerald_deep` | `#327144` | Pressed emerald, dialog glyph fill |
| `amber` | `#E8A04A` | Secondary action, highlights, sitelen-pona accents |
| `amber_deep` | `#C87A26` | Pressed amber |
| `peach` | `#F4B995` | Affection / cute highlight, jan Sewi vibe |

### Type accent (from the five elemental types)

| Token | Hex | Meaning |
|-------|-----|---------|
| `type_seli` | `#E8553E` | Fire — warm red-orange, not harsh |
| `type_telo` | `#4DA3D4` | Water — soft blue, not neon |
| `type_kasi` | `#6FB35C` | Plant — soft green |
| `type_lete` | `#B8D4DC` | Cold — pale icy cream-blue |
| `type_wawa` | `#D4A84E` | Lightning/strong — warm gold |

### Status

| Token | Hex | Use |
|-------|-----|-----|
| `joy` | `#F2C158` | Celebration (caught a creature, level up) |
| `caution` | `#D98A3F` | Hint toasts, warnings |
| `danger` | `#C85A4A` | Low HP, defeat — muted red, never bright |
| `sky_day` | `#A8D8E8` | Overworld sky tint for grass biomes |
| `sky_peak` | `#6B7A83` | Mountain biomes |
| `sky_cold` | `#C4D8E8` | Ice biomes |

## Typography

- **Body (UI text, dialog, descriptions)**: `Nunito` — rounded, warm, highly
  readable on small screens. Designed by Vernon Adams. Variable weight 200-900.
- **Display (headings, toasts, level-up banners)**: `Fredoka` — rounded,
  friendly, playful without being childish. Variable width and weight.
- **Mono (numbers, HP/PP, stats)**: `JetBrains Mono` — for when we need a
  fixed-width digit stack. Not a "code" feel — JetBrains Mono is just clean.
- **Sitelen Pona (canonical TP glyphs)**: `nasin-nanpa 4.0.2 UCSUR` by ETBCOR
  — the standard Unicode PUA-mapped toki-pona hieroglyph font.

**Never used**: Kenney Pixel, Kenney Mini Square, or any pixel/retro display
font. Pixel fonts fight readability on phone screens and communicate "game"
instead of "cozy". The sitelen-pona glyphs provide all the "this is a
different world" we need.

## UI shape language

- **Rounded corners everywhere.** 8-12px on panels, 6-8px on buttons, 4px on
  tags/pips. Nothing sharp.
- **Soft shadows.** `y: 2-4px, blur: 8-12px, rgba(61,46,30,0.15)`. Warm ink
  shadow, not pure black.
- **Warm borders.** Always a 1-2px amber line, never a cold gray outline.
- **Generous padding.** Density is for spreadsheets; warm UI breathes.

## Anti-patterns (things we don't do)

- No backdrop-blur on mobile — kills performance, looks like a web app.
- No neon, no saturated primaries, no pure black or white.
- No "glass morphism", no "cyberpunk" accents, no harsh gradients.
- No Comic Sans alternatives (Fredoka is playful but grown-up).
- No CRT scanlines / pixel-perfect postprocessing — we have pixel art for
  the game world, but the chrome is clean and modern.

## File map

- `res://theme/palette.gd` — static color tokens as GDScript
- `res://theme/toki_theme.tres` — the Godot Theme resource applied project-wide
- `res://theme/styles/panel_parchment.tres` — StyleBoxFlat for parchment
  panels
- `res://theme/styles/button_primary.tres` — emerald action button style
- `res://theme/styles/button_secondary.tres` — amber secondary style
- `res://theme/fonts/` — imported TTF/OTF files
- `res://assets/gui/font/google/` — raw font files with OFL licenses
