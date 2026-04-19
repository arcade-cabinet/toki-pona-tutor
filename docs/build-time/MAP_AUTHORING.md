---
title: Map Authoring — Build-Time Toolchain
updated: 2026-04-19
status: current
domain: technical
scope: build-time
---

# Map Authoring

Build-time toolchain I (Claude) use to author Tiled maps without opening the Tiled editor. Game code never imports anything from this toolchain — it only consumes the `.tmj` files it emits into `public/assets/maps/`.

This is **build-time infrastructure** — a separate slice from gameplay. Lives under `scripts/map-authoring/`, tested under `tests/build-time/`, documented under `docs/build-time/`.

## Why this exists

The game needs 7+ maps to ship. Every map must:

1. Use only Fan-tasy tileset art (no mixing).
2. Have correctly-placed tile layers (Below Player / World / Above Player).
3. Have a valid Objects layer (Spawn Point, Signs, NPCs, Warps, Triggers).
4. Have correctly-shaped Encounters rectangles with valid species tables.
5. Load in Phaser without errors.
6. Look intentional — the player sees a coherent village / route / cave, not a random-tile mosh pit.

Opening Tiled manually and hand-painting 7+ maps is a human-studio workflow, not an agent workflow. I need to author maps programmatically, render them to PNG, review the PNG, iterate until the map matches a spec, and only then commit it.

## What it is

Three binaries plus helpers. All run as `pnpm author:*` scripts:

| Script | Purpose |
|---|---|
| `pnpm author:build <map-id>` | Read `scripts/map-authoring/specs/<map-id>.ts`, emit `public/assets/maps/<map-id>.tmj` |
| `pnpm author:render <map-id>` | Composite tilesets onto a canvas, emit `public/assets/maps/<map-id>.preview.png` |
| `pnpm author:validate <map-id>` | Check firstgid ranges, tile-id validity, object-layer schema, palette references |
| `pnpm author:all <map-id>` | Run validate → build → render as one pipeline |

Plus:

- `scripts/map-authoring/palettes/` — per-tileset palettes: `{ name: 'grass', tsx: 'Tileset_Ground', local_id: 47 }` entries that let specs reference tiles by human name instead of firstgid arithmetic.
- `scripts/map-authoring/specs/<map-id>.ts` — my authored map specs, TypeScript, high-level.
- `scripts/map-authoring/lib/` — shared implementation: TSX parser, TMJ emitter, renderer, palette resolver, validator.

## Spec format — what I actually write

A map spec is a TypeScript module exporting a `MapSpec` object. The spec compiles to `.tmj`.

```typescript
// scripts/map-authoring/specs/ma_tomo_lili.ts
import { defineMap, paint, place } from '../lib';
import { corePalette } from '../palettes/core';

export default defineMap({
  id: 'ma_tomo_lili',
  width: 30,
  height: 20,
  tileSize: 16,
  tilesets: ['Tileset_Ground', 'Tileset_Water', 'Objects_Buildings', 'Objects_Trees'],
  palette: corePalette,

  layers: {
    'Below Player': paint`
      g g g g g g g g g g g g g g g g g g g g g g g g g g g g g g
      g G G G g g g g g g g g w w w w w w w w w w w w g g g g g g
      ...`.grid(),  // each char or pair maps to a palette name (g=grass, G=grass-tall, w=water, .=empty)

    'World': place([
      { at: [5, 5],  tile: 'house_wood_red_small' },
      { at: [12, 8], tile: 'tree_oak_summer' },
    ]),

    'Above Player': place([
      { at: [5, 4],  tile: 'house_wood_red_roof' },   // roof draws over player
    ]),

    'Objects': [
      { type: 'SpawnPoint', at: [15, 12], name: 'default' },
      { type: 'Sign',       at: [14, 12], name: 'welcome',
                            props: { text: 'ma tomo lili' } },
      { type: 'NPC',        at: [16, 10], name: 'jan_sewi',
                            props: { id: 'jan_sewi', dialog_id: 'jan_sewi_intro' } },
      { type: 'Warp',       rect: [29, 10, 1, 4], name: 'to_nasin_wan',
                            props: { target_map: 'nasin_wan', target_spawn: 'from_ma_tomo_lili' } },
    ],

    'Encounters': [],  // ma_tomo_lili is a safe village — no encounters
  },
});
```

**Design invariants for the spec format:**

1. **Palette-first.** Tiles are named, never firstgid'd. The palette is the source of truth for which tileset + local ID a name points to.
2. **Paint for terrain, place for individual objects.** `paint` is a tagged template that takes a grid of palette names, one per cell. `place` is an array of individual placements at `[x, y]`. Mix-and-match per layer.
3. **Objects are declarative.** Each object has a `type` (`SpawnPoint` / `Sign` / `NPC` / `Warp` / `Trigger`), a `name` (unique in its map), an `at` or `rect`, and optional `props`. The toolchain serializes these into Tiled object-layer format with the correct custom-property shape.
4. **Rects are `[x, y, w, h]`** in tile units, not pixels. The toolchain multiplies by `tileSize` on emit.
5. **No "empty" tile sentinel in `place`**; use `paint` with `.` for empty cells.

## Palette format

```typescript
// scripts/map-authoring/palettes/core.ts
import type { Palette } from '../lib';

export const corePalette: Palette = {
  // Ground
  g:  { tsx: 'Tileset_Ground', local_id: 37, description: 'basic grass' },
  G:  { tsx: 'Tileset_Ground', local_id: 44, description: 'tall grass — encounter tile' },
  d:  { tsx: 'Tileset_Ground', local_id: 12, description: 'dirt path' },
  // Water
  w:  { tsx: 'Tileset_Water',  local_id: 5,  description: 'water center' },
  // Objects (by name, not single char)
  house_wood_red_small: { tsx: 'Atlas_Buildings_Wood_Red', local_id: 22, multiTile: { w: 3, h: 3 } },
  tree_oak_summer:      { tsx: 'Objects_Trees', local_id: 1, multiTile: { w: 2, h: 3 } },
  ...
};
```

Short (1–2 char) palette keys are for `paint` grids. Long names are for `place`. Same palette, just different ergonomics per use site.

**Palette ownership**: I populate palettes incrementally as I discover I need a tile. The first time `ma_tomo_lili` needs a red-roof house, I add `house_wood_red_small` to `corePalette` with the right local_id. Palettes grow bottom-up from actual spec needs.

## The TMJ emitter

Responsibilities:

1. Parse each referenced `.tsx` from `public/assets/tilesets/<biome>/Tiled/Tilesets/<name>.tsx` to get tile count + source image path + tile size.
2. Assign `firstgid` values deterministically (alphabetical by tsx name within the map).
3. Emit the Tiled 1.10 JSON format:

```json
{
  "compressionlevel": -1,
  "height": 20,
  "infinite": false,
  "layers": [...],
  "nextlayerid": N,
  "nextobjectid": M,
  "orientation": "orthogonal",
  "renderorder": "right-down",
  "tiledversion": "1.11.2",
  "tileheight": 16,
  "tilewidth": 16,
  "tilesets": [{ "firstgid": 1, "source": "../tilesets/core/Tiled/Tilesets/Tileset_Ground.tsx" }, ...],
  "type": "map",
  "version": "1.10",
  "width": 30
}
```

Where tile data for each tile layer is a flat array of ints (firstgid + local_id, or 0 for empty).

4. Object-layer objects carry Tiled's `properties` array: `[{ name: 'target_map', type: 'string', value: 'nasin_wan' }, ...]`. The emitter translates each spec `props: {...}` object into this format.

5. The emitter writes to `public/assets/maps/<map-id>.tmj`. Phaser loads with `load.tilemapTiledJSON(id, url)`.

**Relative path contract**: the emitted `.tmj` references tilesets by path `../tilesets/<biome>/Tiled/Tilesets/<name>.tsx`. This matches Fan-tasy's internal structure. The `.tsx` files in turn reference PNG images via `../../Art/...` (already valid). Phaser's loader resolves these chains automatically.

## The renderer

Responsibilities:

1. Read a `.tmj`.
2. For each tile layer, in order:
   - For each non-zero cell, look up `firstgid + local_id` → owning tileset + local tile index.
   - Load the tileset's PNG (`node-canvas`), compute source rect from tile index + spacing/margin.
   - Draw source rect to output canvas at `(x * tileSize, y * tileSize)`.
3. Overlay `Above Player` after player-layer markers (render-order visualization).
4. Render object-layer markers as semi-transparent colored overlays:
   - `SpawnPoint` — green 16×16 square with "S" label
   - `Sign` — yellow 16×16 with "!" label + text tooltip on hover (only if interactive mode)
   - `NPC` — blue 16×16 with NPC id label
   - `Warp` — red rectangle spanning `rect` with "→ target_map" label
   - `Trigger` — purple rectangle
5. Optional grid overlay (toggle via `--grid`) for cell alignment review.
6. Emit `public/assets/maps/<map-id>.preview.png` at native tile resolution (1 map px = 1 PNG px).

**Implementation**: `node-canvas` for compositing, `pngjs` as fallback. Own the ~200 LOC rather than wrapping a library — I will need to add object-layer labels, grid overlays, animation frame previews, and other features incrementally; wrapping a library means fighting its assumptions every time.

**Performance note**: renderer caches parsed `.tsx` + loaded PNGs across maps in a single run. Rendering all 7 maps from cold should take < 10s on a laptop.

## The validator

Catches errors before the renderer or Phaser tries to load a broken map. Returns exit 1 with specific diagnostics.

Checks:

1. **Palette references resolve**: every tile name in `paint` / `place` exists in the palette.
2. **Palette entries are internally valid**: `tsx` file exists, `local_id` is in range `[0, tileset.tilecount)`.
3. **Grid dimensions match map dimensions**: `paint` grid row count === `height`, each row length === `width`.
4. **No cell overdraws within a layer**: two `place` entries at the same position on the same layer.
5. **Object names are unique** within a map.
6. **Objects reference valid targets**: `Warp` `target_map` exists as a spec (or is explicitly tagged `external_stub` for pre-authoring).
7. **SpawnPoint exists**: every map has ≥ 1 SpawnPoint.
8. **Object layers allowed**: only `Objects`, `Encounters`, and `Triggers` are valid object layer names.
9. **Encounter rect species lists are valid**: every species id exists in `src/content/spine/species/`.

## CLI

```sh
pnpm author:build  ma_tomo_lili            # spec → .tmj
pnpm author:render ma_tomo_lili [--grid]   # .tmj → .preview.png
pnpm author:validate ma_tomo_lili           # spec-side validation
pnpm author:all ma_tomo_lili                # validate → build → render
pnpm author:all --all                       # iterate every spec in specs/
```

On `build`, if the spec has changed since the last emitted `.tmj`, rewrite. `render` is always a fresh render.

## Review workflow

This is how I actually use this toolchain to author a map:

1. Create `scripts/map-authoring/specs/<map_id>.ts` with a rough layout — minimal palette entries, rough `paint` grid.
2. Run `pnpm author:all <map_id>`.
3. Open `public/assets/maps/<map_id>.preview.png` and inspect.
4. Find what's wrong: wrong tile, misaligned object, bad path shape, roof not over house.
5. Edit the spec (palette entry or layer content).
6. Re-run `pnpm author:all <map_id>`.
7. Repeat until the preview looks like the intended scene.
8. Run `pnpm test:build-time` to confirm toolchain-level correctness.
9. Commit spec + `.tmj` + preview PNG together.

The preview PNG is checked into git alongside the spec + `.tmj`. Reviewers can eyeball the PNG without running the toolchain. If a spec change doesn't change the preview, something's wrong — the preview is the visual regression guard.

## What this is NOT

- **Not a runtime thing.** Game code never imports from `scripts/map-authoring/`.
- **Not a replacement for Tiled.** Humans with Tiled can still edit the emitted `.tmj` if they want. The toolchain's emitter writes clean Tiled-compatible JSON.
- **Not a map editor UI.** No in-browser interactivity, no drag-to-place. I write code; the toolchain emits + renders; I read the PNG; I adjust.
- **Not smart.** It's deterministic transform + pixel composition. No AI layout, no autotiling (Tiled already has those; if I need them, I open Tiled and save; my toolchain just round-trips the saved file).

## Tests (what `tests/build-time/` proves)

The tests don't verify "the map looks pretty" — they verify **toolchain operability**. I use the preview PNG visually; the tests make sure the toolchain itself is correct.

### Unit-level (pure functions, fast)

1. **Parser**: given a known Fan-tasy `.tsx`, the parser extracts tilecount, image source, tilesize correctly.
2. **Palette resolution**: given a palette entry + a set of tilesets with known firstgid, `resolvePalette('grass')` returns the correct absolute GID.
3. **Emitter schema**: given a minimal spec, the emitted JSON matches the Tiled 1.10 schema (validated against Tiled's own JSON schema or a hand-written Zod).
4. **Emitter determinism**: running the builder twice on the same spec produces byte-identical output.
5. **Renderer size**: given a 30×20 map at 16px tiles, the output PNG is exactly 480×320 pixels.
6. **Renderer paints correctly**: a spec with a single tile at `[5, 5]` of a known color produces a PNG with that color at the expected pixel coordinates (sampled).
7. **Validator catches broken specs**: unknown palette name → error; out-of-range local_id → error; missing SpawnPoint → error; overdrawn cell → error.

### Fixture-level (per-tileset coverage)

8. **Every Fan-tasy pack has a sample fixture**: the test suite discovers packs under `public/assets/tilesets/*/` and asserts each has at least one `.tmx` sample + matching preview PNG.
9. **Sample round-trip**: for each fixture, `tiled --export-map json` converts the `.tmx`, my renderer produces a PNG, and the PNG pixel-compares to the author-shipped preview within tolerance.
10. **Tileset coverage**: for each tileset file referenced by any sample, my parser + palette resolver handles every tile index in range. A tileset used in a sample but failing to parse fails the test.

### Integration-level (end-to-end, slower)

11. **Runtime Phaser load**: the `.tmj` for a real runtime map (e.g. `ma_tomo_lili`) loads in a headless Phaser instance without error. Gated behind `--integration` tag so unit tests stay fast.

## Decisions I'm making up front

Documented here so future sessions (including future-me) don't re-litigate them:

1. **Palette keys for `paint` are 1–2 chars.** Longer keys break grid readability. Multi-tile props go in `place`, not `paint`.
2. **I use node-canvas for rendering, not headless Phaser.** Headless Phaser is overkill for the review loop; a second render mode via Playwright can exist later for "final fidelity" check but isn't needed for iteration.
3. **Preview PNGs are committed to git.** Yes, they bloat the repo. Yes, they're regeneratable. But they're the visual regression guard — reviewing a PR means looking at the PNG diff, not running the toolchain.
4. **Multi-tile objects (houses, trees) are a single palette entry with `multiTile: { w, h }`.** The `place` step expands to `w*h` tile placements aligned to the top-left anchor. Keeps specs terse.
5. **I author palettes bottom-up.** A palette entry exists iff a spec uses it. No speculative palette buildup.
6. **No object-layer sugar for "facing direction" yet.** If I later need NPCs to face a direction, I'll add a `facing: 'left' | 'right' | 'up' | 'down'` prop. YAGNI for now.
7. **Object-layer coordinates are in tile units in the spec, pixel units in the .tmj.** Consistent with Tiled's tile-layer-vs-object-layer split. Spec author thinks in tiles; emitter converts.

## Fan-tasy sample maps are per-tileset fixtures

Fan-tasy's tileset author ships sample `.tmx` maps inside each pack — `Village Bridge.tmx`, `Farm Shore.tmx`, `Mage Tower.tmx`, `Test map.tmx`, plus pack-specific samples in `seasons/`, `snow/`, `desert/`, `fortress/`, `indoor/`. Each one is a human-authored demonstration of that pack's tiles.

**These are test fixtures, NOT runtime maps.** The game is authored end-to-end; it does not ship reskinned vendor demos.

### Why fixtures, not runtime

- **Runtime maps must be poki-soweli-specific.** `ma_tomo_lili`, `nasin_wan`, etc. are narrative beats from `docs/LORE.md` and need layouts that serve *those* stories — jan Sewi at a specific shrine, tall grass on a specific path, a specific warp to region 2. Vendor sample layouts don't encode any of that.
- **Tonal coherence comes from the tileset, not the layout.** If my toolchain correctly paints any Fan-tasy tile, a hand-authored `ma_tomo_lili.tmj` using Fan-tasy's `core` pack will look as coherent as `Village Bridge.tmx` does. The risk was sprite mismatch (Kenney next to Lonesome Forest); that's a tileset-mixing problem, not a layout problem.
- **The game's identity is in its authoring.** Using sample layouts would bake vendor-specific aesthetic choices (cobblestone paths arranged *their* way, buildings grouped *their* way) into our story locations. We'd lose the argument for "this is poki soweli's world, not a Fan-tasy demo."

### Where they earn their keep — the test suite

Each pack ships ≥ 1 sample map; each sample is a golden fixture:

- **Parser coverage**: my `.tsx` parser runs against every tileset that pack's samples reference. If any tileset fails to parse, a sample fails to round-trip, and I see it.
- **Tileset coverage**: if the sample uses tile ID 1847 of `Tileset_Ground`, my palette inspector can pull that ID and I know what tile ID 1847 *is* — the sample is a visual decoder ring for the tileset.
- **Renderer pixel validation**: each sample ships with an author-provided preview PNG (`Village Bridge.png` next to `Village Bridge.tmx`). I convert the `.tmx` → `.tmj` via `tiled --export-map json`, render my `.tmj` through my compositor, pixel-compare against the author's PNG. If they differ by more than a tiny tolerance, my renderer has a bug.
- **Per-pack completeness**: a test asserts every pack has at least one sample fixture, and every sample fixture round-trips clean. This means whenever a new pack lands (or we update a pack), the test suite catches regressions immediately.

Fixture layout:

```
tests/build-time/fixtures/
└─ tilesets/
   ├─ core/            — samples: Village Bridge, Farm Shore, Mage Tower, Test map
   ├─ seasons/         — samples: (from pack)
   ├─ snow/            — ...
   ├─ desert/          — ...
   ├─ fortress/        — ...
   └─ indoor/          — ...
      └─ each contains:  golden.tmj (converted), expected.png (author-provided), manifest.json
```

The fixtures themselves are not vendored separately — they're symlinked / path-referenced to the already-present samples under `public/assets/tilesets/<pack>/Tiled/Tilemaps/`. The test suite does the conversion at test-setup time (or, cheaper, once at repo-init time with the converted `.tmj` committed as a `.golden.tmj` next to the source `.tmx`).

### Palette seed data

A secondary benefit: inspecting a sample's tile data teaches me what tile produces what visual element. When I want "grass" for my palette, I look at the ground layer of Village Bridge and read which local_id in `Tileset_Ground` is used for plain grass. That local_id goes in my palette. When the tileset has ambiguous or unlabeled tiles, the sample disambiguates by use.

My palette grows via sample inspection, not via guessing. When a spec needs a tile that no sample demonstrates, I open Tiled manually and pick one — but that's the exception. The toolchain includes a `pnpm author:inspect <tileset> <sample>` command that dumps "tile X at position Y in layer Z uses local_id N" so I can harvest palette entries.

### Converter step

The toolchain includes a converter, used by the fixture test setup:

```sh
pnpm author:convert-tmx <source.tmx> <out.tmj>
```

Wraps `tiled --export-map json`. Not used for runtime maps — runtime maps are MapSpec-authored from scratch. Used at fixture-init time to produce the goldens.

## Open questions (deferred)

- Animated tilesets (candles, flowers, waterfall). Tiled supports these natively in `.tsx`; Phaser renders them. My renderer will render frame 0 only for the preview PNG. Good enough unless I start seeing positioning bugs that need frame-N review.
- Autotile / wang-tile support. Fan-tasy has wang rulesets in `Rules/*.tmx`. I'm going to skip autotiling for now and manually pick tiles — if I end up authoring enough maps to miss autotiling, I'll revisit. For Phase-1 slice it's not needed.
- Layered object collision. `collides: true` property is per-tile in the tileset `.tsx`, not per-layer in the map. I don't need map-authoring to express this; it's already in the tilesets.
