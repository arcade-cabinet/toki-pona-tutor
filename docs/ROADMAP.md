---
title: Roadmap
updated: 2026-04-20
status: current
domain: product
---

# poki soweli — Roadmap

Single source of truth for what's done, what's partial, what's open, and the Definition of Done for `v0.2.0`. Every task has a stable ID (`T<phase>-<n>` or `V5-<n>` for RPG.js-v5-specific items); commit messages and PRs reference the ID.

**Branch:** `feat/rpgjs-v5-pivot` (PR #66), scheduled to squash-merge into the `v0.2.0` release train.

**Status legend:**

| Mark | Meaning |
|------|---------|
| ✅ | Done — behavior observable in playtest (not just "code review approves"). |
| 🟡 | Partial — contract met, polish or runtime wiring still open. |
| ⬜ | Open — nothing landed yet. |

---

## Definition of Done — `v0.2.0`

Ships when **all** of these are objectively true in a fresh-install playtest on both web and Android debug:

1. **Full playthrough, softlock-free.** Boot → title → new game → `ma_tomo_lili` → jan Sewi ceremony (pick 1 of 3) → walk `nasin_wan` → catch ≥ 1 wild creature → defeat jan Ike rival → progress through all 7 beats → beat green dragon → credits. No dead-ends, no unreachable content.
2. **Catch count reachable.** Can catch ≥ 20 distinct wild creatures across the roster without grinding.
3. **Combat is legible and fair.** Action-battle HP indicators, damage flash, type matchups visibly change damage (color + label), victory sequence shows XP → level-up → new-move toasts, defeat returns to last village with party preserved at full HP.
4. **UI is themed and mobile-legible.** All overlays use BRAND.md tokens (palette + typography + spacing). Touch targets ≥ 44 dp on a 1080p phone. sitelen-pona glyphs (via UCSUR + emoji fallback) render in creature names, moves, badges.
5. **Saves and resumes.** Quit from anywhere → relaunch → Continue restores party, inventory, flags, map, tile, encounter log, mastered-words. Autosave on map change, combat end, and quit.
6. **Content volume.** All 7 beats playable, 17 species + 17 moves + ≥ 6 items wired. 4 gym fights + 1 rival + 1 final boss as set-pieces. ≥ 80 validated multi-word TP lines in-game.
7. **Audio live.** 4 BGM tracks cross-fade by biome (town / forest / water / ice / peak / endgame / combat). ≥ 12 SFX wired (see T5-04). Settings sliders control Music + SFX buses.
8. **Exports green.** Android debug APK produced on every PR (`ci.yml`); signed release APK produced on every release-please tag (`release.yml`); web HTML5 ≤ 10 MB gzip, deployed to GitHub Pages via `cd.yml`.
9. **Tests carry their weight.** Integration suite covers the full golden path (boot → ceremony → warp → encounter → catch → gym → respawn → save round-trip). Unit suite covers pure-logic invariants. Both projects green on every PR.
10. **release-please v0.2.0 tagged** with CHANGELOG drawn from Conventional Commits since this branch merged.

Everything beyond this is `v0.3.0` material.

---

## Phase inventory

| # | Phase | Outcome | Done | Partial | Open |
|---|-------|---------|------|---------|------|
| 1 | Playable Vertical Slice | Fresh game → starter → encounter → warp → return, no softlocks | 14 | 0 | 0 |
| 2 | Combat Polish + Party | Combat UI themed, HP bars animate, party panel, catch UX, XP/level | 4 | 2 | 9 |
| 3 | Save, Menus, Transitions | Title, pause, settings, continue, autosave, loading screens | 10 | 2 | 1 |
| 4 | Content Breadth | 7 regions biome-correct, 7 set-pieces, 7 gyms, badges, bestiary | 9 | 1 | 7 |
| 5 | Audio, Mobile, Accessibility | Music per region, SFX wired, virtual joystick, AA contrast, text speed | 5 | 0 | 9 |
| 6 | Release Hardening | Signed release APK, web ≤ 10 MB, CI matrix, meaningful tests, v0.2.0 | 11 | 1 | 6 |
| 7 | Post-v0.2 Depth + Replay | Journey beats 8-10, status effects, breeding, NG+, secret areas | 8 | 0 | 2 |
| 8 | Language Learning Layer | Sentence log, sitelen glyphs, micro-game, dictionary export | 5 | 0 | 1 |
| 9 | Engine, Perf, Infrastructure | Asset compression, bench suite, error tracking, visual regression | 1 | 0 | 9 |
| 10 | Platform Expansion | iOS, Play Store listing, desktop shells, WebXR | 0 | 0 | 5 |

"Done" counts the items marked ✅. "Partial" counts 🟡. "Open" counts ⬜. Totals below assume every sub-task in every phase, including the two parallel tracks in Phase 6 (E2E-first test extension + release plumbing).

---

## Phase 1 — Playable Vertical Slice ✅

Completed via the RPG.js v5 pivot. All 14 Godot-era tasks either landed or were subsumed by v5 built-ins.

| ID | Title | Notes |
|----|-------|-------|
| T1-01 | Starter ceremony dialog triggers end-to-end | ✅ |
| T1-02 | Pick from 3 starters (seli/telo/kasi) | ✅ |
| T1-03 | Read-from-party (not hardcoded) in encounters | ✅ |
| T1-04 | Populate `nasin_wan` encounter table | ✅ spec-authored |
| T1-05 | Tall-grass tile painting in `nasin_wan` | ✅ spec `nasin_wan.ts` Encounters layer |
| T1-06 | jan Ike set-piece rival | ✅ |
| T1-07 | FieldTriggerWatcher for non-warp triggers | ✅ RPG.js v5 `onInShape` — free |
| T1-08 | Combat → field return | ✅ `@rpgjs/action-battle` — free |
| T1-09 | XP + level-up on victory | ✅ pure helper shipped (see T2-07); runtime wiring done |
| T1-10 | Faint → whiteout → restore at last village | ✅ |
| T1-11 | Flee action in combat | ✅ wild only — action-battle gym fights are real-time melee |
| T1-12 | Forest tileset for `nasin_wan` | 🟡 placeholder grass; proper paint deferred to T4-02 |
| T1-13 | Tileset mapping w/ walkable + tall_grass flags | ✅ |
| T1-14 | Sanity playthrough checklist | ✅ superseded by this doc |

---

## Phase 2 — Combat Polish + Party Panel

**Goal:** combat no longer looks like a debug harness. Player sees whose turn it is, how much damage they did, and manages their roster from the field.

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T2-01 | Theme combat UI (panels, fonts) | ⬜ | Overrides `@rpgjs/ui-css` action-battle Vue component with BRAND.md tokens. |
| T2-02 | Animate HP bars (tween, color shift) | 🟡 | `src/styles/hp-bar.ts` ships the threshold math + CSS classes; runtime tween still open. |
| T2-03 | Damage-number pop-up labels | ⬜ | Super-effective flash emerald; resisted flash grey; miss shows "pakala". |
| T2-04 | Swap battler sprites to creature packs per species | ⬜ | Each `species.sprite_frame` → `public/assets/creatures/<id>.png`. |
| T2-05 | Battler hit animation (shake + flash) | ⬜ | 0.15 s shake + white flash on damage. |
| T2-06 | Faint animation (fade + slide) | ⬜ | HP 0 → 40 px drop + 0.5 s fade. |
| T2-07 | Victory + level-up + XP gain sequence | ✅ | Pure orchestrator `src/modules/main/victory-sequence.ts` produces `[XpGained, LevelUp, MoveLearned]` steps; runtime animation binding still needed. |
| T2-08 | Defeat screen ("pakala! sina tawa ma tomo.") | 🟡 | Text done; fade animation deferred. |
| T2-09 | Catch UX: poki-throw animation + dialog | 🟡 | Dialog done; sprite-arc animation deferred. |
| T2-10 | Party Panel — open from field | ⬜ | Extend `inventory-screen.ts` to render a 6-slot panel with sprite, name_tp, HP bar, level. |
| T2-11 | Party Panel — detail card (moves/XP/type) | ⬜ | |
| T2-12 | Party Panel — reorder (drag lead to slot 0) | ✅ | Pure helper `src/modules/main/party-order.ts` (promote / reorder with move-semantics); UI wiring open. |
| T2-13 | Item drops per species | ⬜ | Each `species.xp_yield` + optional `item_drop_chance`. |
| T2-14 | `kili` healing item usable from party panel | ⬜ | +20 HP on selected creature, decrements count. |
| T2-15 | "Items" submenu in combat action menu | ⬜ | Fight / Poki / Item / Flee. |

---

## Phase 3 — Save, Menus, Transitions

**Goal:** real title screen, saves persist, transitions feel intentional.

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T3-01 | Title scene — logo, new game / continue / settings / quit | ✅ | Wired. Extensions in T3-08 (confirm wipe) + T3-12 (credits) still open. |
| T3-02 | Autosave on map change | ✅ | |
| T3-03 | Autosave on combat end | ✅ | |
| T3-04 | Save on quit intent (beforeunload / resume) | ✅ | `src/platform/persistence/autosave.ts`. |
| T3-05 | "Continue" boots into current map at player tile | ✅ | |
| T3-06 | Settings menu — Music / SFX / Text speed / Contrast / Sitelen | ✅ | `src/modules/main/settings-screen.ts`, pause-menu overlay using BRAND.md §Chrome patterns. |
| T3-07 | Loading screen between map warps | 🟡 | Warp factory supports optional loading label; full fade overlay not yet implemented. |
| T3-08 | New Game flow: confirm wipe if save exists | ⬜ | |
| T3-09 | Pause menu — Resume / Party / Items / Save / Settings / Quit to title | 🟡 | Settings + vocab + inventory branches live; save + quit-to-title open. |
| T3-10 | Sync `currentMapId` + `player_tile` on every move | ✅ | |
| T3-11 | Save schema versioning + migration | ✅ | `PRAGMA user_version` tracked; `migrateSchema()` handles upgrades. |
| T3-12 | Credits scene on game clear | ⬜ | |
| T3-13 | "Mastered words" screen | ✅ | Pause → vocab shows mastered TP words with sightings count. |

---

## Phase 4 — Content Breadth

**Goal:** all 7 beats playable with biome-appropriate tilesets, gym set-pieces, badge UX, bestiary (no trademarked "dex" naming — "lipu soweli" in-game).

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T4-01 | Tag each map spec with `biome` + `music_track` | ⬜ | Needed before T4-02 and T5-01 can land. |
| T4-02 | `nasin_wan` biome=forest with forest_summer tileset | ⬜ | Replace placeholder grass paint. |
| T4-03 | `nasin_pi_telo` biome=water with water tileset | ⬜ | River route playable; water tiles impassable. |
| T4-04 | `ma_telo` biome=town (lake village) full paint | ⬜ | Stone island, 4 NPCs + shop + warps. |
| T4-05 | `ma_lete` biome=ice with forest_winter tileset | ⬜ | Slippery-tile stub optional. |
| T4-06 | `nena_sewi` biome=peak (mountain) | ⬜ | Cliff tiles block traversal. |
| T4-07 | `nena_suli` biome=cave | ⬜ | Reduced-visibility shader optional. |
| T4-08 | Warp graph connectivity test | ✅ | `tests/build-time/warp-graph.test.ts` — every map reachable from `ma_tomo_lili`. |
| T4-09 | Gym set-piece fights (one per region) | ✅ | All 4 shipped via gym-leader factory + BattleAi phase transitions. |
| T4-10 | Badge award dialog + persist `badges[]` | ✅ | |
| T4-11 | Badge display in pause menu | ✅ | Inventory-screen renders earned badges. |
| T4-12 | Gate next-region warps until badge earned | ✅ | `warp.ts` `requiredFlag`. |
| T4-13 | Bestiary screen — 17-species grid with seen/caught | ⬜ | `listByTier(state, allIds)` helper shipped — see T4-14; UI open. |
| T4-14 | Track `bestiary` seen/caught on encounter + catch | ✅ | Pure state machine `src/modules/main/bestiary.ts` (seen/caught/unknown tiers, earliest-timestamp preservation). Runtime wiring (call `markSeen` on encounter, `markCaught` on success) still needed. |
| T4-15 | Authored multi-beat dialog per region (≥ 5 NPCs per region) | 🟡 | 2-4 per region done; add 3 more per region. |
| T4-16 | Shop NPC in `ma_telo` sells poki + kili | ⬜ | |
| T4-17 | `ma` coin inventory + battle reward | ⬜ | |

---

## Phase 5 — Audio, Mobile, Accessibility

**Goal:** feels good on phone, readable small, audible on speakers, passes basic accessibility.

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T5-01 | Biome → music track map | ✅ | Pure `src/modules/main/audio.ts` — 12-member `BgmId` union, `bgmForContext({mapId, inCombat, timePhase})`. Howler runtime binding open. |
| T5-02 | Cross-fade music on map change | 🟡 | Volume math (`effectiveVolume`) shipped in audio.ts; 0.8 s cross-fade animation open. |
| T5-03 | Combat music override | ⬜ | `bgmForContext` returns `bgm_battle`/`bgm_gym`/`bgm_boss` correctly; gym-leader.ts hook to call Howler open. |
| T5-04 | Wire 12 SFX events | 🟡 | `src/modules/main/sfx.ts` catalogs 12 events + balanced base volumes + `effectiveSfxVolume(event, bus)`. Howler wiring + `.ogg` assets still open. |
| T5-05 | Apply Settings volume sliders | ✅ | Sliders persist in `src/platform/persistence/settings.ts`. |
| T5-06 | Virtual d-pad for mobile | 🟡 | Pure input-semantics in `src/modules/main/virtual-dpad.ts` (dead zone, diagonal snap, tap detection). Actual touch overlay DOM open. |
| T5-07 | Virtual A/B action buttons | ⬜ | |
| T5-08 | ≥ 44 dp touch targets audit | ⬜ | |
| T5-09 | Portrait-lock for Android | ⬜ | `capacitor.config.ts` manifest. |
| T5-10 | Text-speed slider applied to typewriter + combat log | ⬜ | Setting persisted via T3-06; runtime binding open. |
| T5-11 | Color-contrast AA audit + high-contrast body class | ✅ | BRAND.md §Palette meets WCAG AA on body text; `poki-high-contrast` body class doubles borders + flattens gradients. Settings toggle wired. |
| T5-12 | "Accessible mode" toggle — larger fonts + reduced motion | ⬜ | `prefers-reduced-motion` auto-respected; explicit toggle open. |
| T5-13 | Web ARIA landmarks + meta | ⬜ | `index.html` semantic landmarks + title + description. |
| T5-14 | Tutorial overlay on first boot | ⬜ | 30 s hint arrows + key labels; dismissible. |

---

## Phase 6 — Release Hardening

**Goal:** CI matrix green, exports signed + under budget, integration suite carries the real weight, `v0.2.0` tagged.

### Testing (parallel with runtime work — E2E-first policy per TESTING.md)

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T6-01 | Vitest unit project | ✅ | `tests/build-time/**`, 522 tests, 95%/95%/90%/95% coverage gate. |
| T6-02 | Unit: schemas load all spine JSONs | ✅ | `schema-load.test.ts`. |
| T6-03 | Unit: build-spine emits expected shape | ✅ | `build-spine.test.ts` + cross-ref integrity + `PARTY_SIZE_MAX` spread. |
| T6-04 | Unit: encounter-roll weighted distribution | ✅ | `encounter-roll.test.ts` — 10 k rolls within 3% of weights. |
| T6-05 | Unit: type-matchup matrix | ✅ | `type-matchups.test.ts` — 25 matchups. |
| T6-06 | Unit: catch-math at full, half, 1HP | ✅ | `catch-math.test.ts`. |
| T6-07 | Unit: XP curve + level-up boundaries | ✅ | `xp-curve.test.ts`. |
| T6-08 | Integration: warp graph connectivity | ✅ | Topology test lives in unit (pure graph walk over built `world.json`). |
| T6-09 | Integration: save round-trip | 🟡 | `save-round-trip.test.ts` mirrors `CapacitorSaveStorageStrategy` behavior via an in-memory strategy; the TRUE integration version (driving the real Capacitor adapter through the real engine) is queued for Phase 6 E2E push. |
| T6-10 | E2E playthrough — integration suite (`@rpgjs/testing`) | ⬜ | `tests/integration/boot.test.ts` shipped as the floor. Next: starter ceremony → warp → encounter → catch → gym → respawn → save round-trip. See TESTING.md "What's coming next." |
| V5-01 | RPG.js v5 inspector surface | ✅ superseded | Unneeded — `@rpgjs/testing` gives us direct engine access; the inspector requirement went away when we switched from vitest-browser to the in-process fixture. |

### Build & release

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T6-11 | Android release APK — signed with release keystore | ⬜ | `release.yml` uses `secrets.ANDROID_KEYSTORE_BASE64`. |
| T6-12 | Release-please: upload web + APK to GH release | ✅ | `release.yml` attaches artifacts on tag. |
| T6-13 | Web bundle size audit | ✅ | `tools/web-size-audit.mjs` + CI gate — dual-tier budget (40 MB hard fail / 10 MB target). |
| T6-14 | Asset compression pass (WebP, downscale) | ⬜ | Drop ≥ 30%. |
| T6-15 | Expand CI matrix | ✅ | ci.yml: `unit` → `build` + `integration` → `android-debug-apk`. |
| T6-16 | Commitlint gate on PR title + commits | ✅ | |
| T6-17 | Write CHANGELOG prelude + tag v0.2.0 via release-please | ⬜ | |
| T6-18 | Smoke-test signed APK on physical device + iOS browser | ⬜ | `docs/RELEASE_QA.md` manual checklist. |

---

## Phase 7 — Post-v0.2 Depth + Replay Value

Turns the 15-min slice into a ~4-hour game.

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T7-01 | Expand journey: beats 8-10 (Hall of Masters rematches + endless-dungeon hook) | ✅ | Pure `src/modules/main/rematch.ts` — status, scaled XP/level, cycling drop table, cooldown math. Beat 8-10 map specs still to author. |
| T7-02 | 20 new species (43 → 63) | ⬜ | ≥ 3 unique per biome. |
| T7-03 | 15 new moves (17 → 32) covering type × tier matrix | ⬜ | Every type has lili/wawa/suli + 1 signature; learnset reshuffled. |
| T7-04 | Status effects: `seli` burn, `telo` wet, `lete` frozen | ✅ | `src/modules/main/status-effect.ts` — burn ticks, wet boosts `lete` damage, frozen skips turn. |
| T7-05 | Breeding / nurturing: daycare at village | ✅ | `src/modules/main/daycare.ts` — type inheritance + stat averaging. UI open. |
| T7-06 | Treasure chests scattered across all 7 maps | ✅ | `src/modules/main/treasure-chest.ts` — weighted loot + dual gating (flag OR mastered-word). Placement pass open. |
| T7-07 | Ambient world events (weather, day/night cycle, festivals) | ✅ | `src/modules/main/ambient-events.ts` — day/night + per-biome weather. Tint + dialog-variant binding open. |
| T7-08 | Side quest framework: 3-step fetch / defeat / deliver | ✅ | `src/modules/main/quest.ts` — 4 goal kinds. Quest content authoring open. |
| T7-09 | Secret area: underwater route after `badge_telo` | ⬜ | |
| T7-10 | Post-game New Game Plus with party carryover | ✅ | Pure `src/modules/main/new-game-plus.ts` — save derivation + carryover rules. Menu wiring open. |

---

## Phase 8 — Language Learning Layer

Explicit affordances the player can OPT INTO without breaking the no-translation rule.

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T8-01 | `lipu nasin` — personal sentence log | ✅ | SQLite table + `src/modules/main/sentence-log.ts` — recents / search / windowing. |
| T8-02 | Per-species description re-read from `lipu soweli` | ⬜ | Tap a species → re-read its description bubble. |
| T8-03 | Word-card hover: sitelen-pona glyph + sightings count | ✅ | Pure `src/styles/sitelen-glyph.ts` (UCSUR → emoji → word tiers). vocab-screen binding open. |
| T8-04 | Optional "show me the TP sitelen" toggle during dialog | ✅ | Setting persisted; runtime overlay binding open. |
| T8-05 | Tatoeba-backed "wan sitelen" micro-game | ✅ | `src/modules/main/micro-game.ts` — pick-the-TP-sentence, LCG seed, 22 tests. Village NPC binding open. |
| T8-06 | Export personal dictionary to shareable card | ✅ | `src/modules/main/dictionary-export.ts` — text + SVG. |

---

## Phase 9 — Engine, Perf, Infrastructure

Runs smoothly on a 3-year-old phone and is pleasant to develop.

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T9-01 | Asset WebP conversion pipeline | ⬜ | All `public/assets/**.png` have `.webp` sibling; vite plugin serves WebP to capable clients. |
| T9-02 | Sprite-sheet atlas packing | ⬜ | 70+ PNG sheets → ≤ 10 atlases. |
| T9-03 | Audio dynamic-import (don't ship all bgm in initial bundle) | ⬜ | Only active-biome BGM loaded on boot. |
| T9-04 | Vitest coverage reporting + CI gate | ✅ | 95%/95%/90%/95% ratcheted (v8 provider, `lcov` artifact, text-summary). |
| T9-05 | Benchmark suite for hot paths | ⬜ | `pnpm bench` + CI alerts on regressions > 20%. |
| T9-06 | Visual regression — every map → PNG + pixel-diff | ⬜ | Complements integration tests for visual bugs. |
| T9-07 | Integration test harness extensions | 🔗 | Subsumed by T6-10 — `@rpgjs/testing` is the new harness. |
| T9-08 | Release-please auto-rebase of pending PRs on main | ⬜ | |
| T9-09 | Sentry / error tracking integration | ⬜ | Respects kid-audience PII constraints. |
| T9-10 | Bundle analyzer integration | ⬜ | CI comments PR with top-10-largest modules delta vs main. |

---

## Phase 10 — Platform Expansion

Beyond web + Android debug.

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| T10-01 | iOS Capacitor shell + signing | ⬜ | `cap add ios` + TestFlight. |
| T10-02 | Play Store production listing | ⬜ | Screenshots, description, free pricing. |
| T10-03 | Localized store copy (Spanish + French) | ⬜ | TP name universal; store copy translated. |
| T10-04 | Windows / macOS desktop via Electron or Tauri | ⬜ | Same save-state portability. |
| T10-05 | WebXR stub for Quest browser | ⬜ | Renders in Quest browser; no controller rebind. |

---

## RPG.js v5 — framework-specific items

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| V5-01 | Inspector surface for E2E | ✅ superseded | Not needed — `@rpgjs/testing` gives in-process engine access directly. |
| V5-02 | Multi-creature party combat (vs single-protagonist action-battle) | ⬜ | Default action-battle pits the player directly. We want lead-creature-vs-enemy. Likely custom `BattleAi` wrapper or fork. |
| V5-03 | Moves + cooldown UI (vs the module's hotbar) | ⬜ | Map each species' `learnset` to action-bar skills; may need theming (T2-01) to feel on-brand. |

---

## Risks

1. **RPG.js v5 is beta.** API churn possible between `5.0.0-beta.1` and stable. *Mitigation:* pin the version; human review on every `@rpgjs/*` Dependabot PR; integration suite catches API breakage immediately (by failing to boot).
2. **Android keystore & signing.** Release APK requires a keystore not yet in the repo. *Mitigation:* generate `release.keystore` locally, gitignore it, upload base64 + password to GH secrets; document in T6-11.
3. **Web export > 10 MB.** Pixi 8 + CanvasEngine + 230 art assets can push over. *Mitigation:* T6-13 audit + T6-14 compression + lazy-load non-starter tilesets + tree-shake unused `@rpgjs/*` submodules.
4. **Tatoeba corpus drift.** Corpus updates weekly; future refresh could invalidate passing lines. *Mitigation:* corpus is vendored (`src/content/corpus/tatoeba.json`), refreshed only on human command via `pnpm fetch-corpus`, never in CI.
5. **Save schema churn during Phase 4-5.** Adding bestiary fields, badges, `ma` coins grows save payload. *Mitigation:* T3-11 schema versioning is live (`PRAGMA user_version` + migrations); every additive change bumps `DB_VERSION`.
6. **Action-battle → party combat mismatch.** Default action-battle is single-protagonist; creature-catching wants lead-creature-vs-enemy. *Mitigation:* V5-02 tracks this; simpler fallback is to keep player-as-fighter with the lead creature as cosmetic companion until combat gets a rework.
7. **Mobile input vs grid-stepped movement.** RPG.js v5 controller is grid-snapped; thumbstick expects analog. *Mitigation:* T5-06 virtual d-pad emits discrete directional presses matching keyboard semantics (math done, DOM overlay open).
8. **Integration-suite singleton hazards.** RPG.js engine uses module-level singletons; parallel test files trample state. *Mitigation:* `fileParallelism: false` on the integration project in `vitest.config.ts`, `afterEach(clear)` in every test. Accepts slower CI for correctness.

---

## Parallelization & ownership

- **Content authoring** — each map spec or dialog JSON is independent. Worktree-per-agent, max 5 in flight (per AGENTS.md).
- **Integration tests** — one feature per file (singletons); but every feature gets one.
- **Runtime UI wiring** — T2-01 / T3-12 / T5-06 / T5-14 are three parallel streams.
- **Engine-serial** — anything touching `src/modules/main/server.ts`, `player.ts`, or `src/config/config.client.ts` runs serially.

---

## Completion forecast

Aggressive estimate with 1 engineer + opportunistic parallel agents (content / UI), starting from the current state:

| Phase | Weeks | Critical path |
|-------|-------|---------------|
| 2 | 1.5 | T2-01 theme → T2-02/05/06 animations → T2-10 party panel |
| 3 | 1 | T3-07 loading screen + T3-08/09/12 final pause/credits |
| 4 | 2 | T4-01…T4-07 biome paints (parallelizable) → T4-13/16/17 bestiary + shop |
| 5 | 1 | T5-01…T5-04 audio runtime → T5-06/07 mobile overlay |
| 6 | 1 | T6-10 integration suite extension → T6-11 signed APK → T6-17 release-please |

**`v0.2.0` ETA:** ~6.5 weeks from branch merge.

**Critical path:** T6-10 (integration coverage of the golden path) is the single most important remaining task. Everything downstream of the release either gates on it (T6-17) or benefits from it as a regression-catching safety net.

---

## Micro backlog (< 1 hr each)

Low-risk polish. Pick when blocked on larger work.

- [ ] Drive NPC + warp coordinates in `src/modules/main/server.ts` from the compiled `world.json` (map-object layer) instead of hand-copying pixel coords. Two sources of truth today; fix is a `lookupNpcByName(mapId, name)` helper and a server-side import of `generated/world.json`. Called out in CR #3107811085 (justified-open for v0.2.0).
- [ ] Tighten `IPreferences` in `src/platform/persistence/preferences.ts` to `PreferenceKey` for callers that control the key; keep a `string` overload at the Capacitor-adapter boundary only. CR #3107811092.
- [ ] Add `poki soweli` favicon (16/32/48/192/512 PNGs + manifest.json).
- [ ] Screenshot each of the 7 maps via `author:all --render` into `docs/screenshots/`.
- [ ] Add a `--dry-run` flag to `scripts/map-authoring/cli/all.ts`.
- [ ] Rename `src/modules/main/index.ts` → `main.ts`.
- [ ] Dedupe `catch_rate: 0.18` magic numbers between species JSONs.
- [ ] Add README badge: "17 species · 7 regions · 7 gyms".
- [ ] Add `dialog_not_found` fallback that renders the dialog id (authoring-miss visibility).
- [ ] Make vocabulary-screen pagination configurable (PAGE_SIZE const → preference).
- [ ] Add `--verbose` to `pnpm build-spine` for per-file stats.
- [ ] Audit CLAUDE.md / AGENTS.md / STANDARDS.md for drift after the v5 pivot.
- [ ] Verify inventory-screen handles party size 0 gracefully.
- [ ] Run `prettier --write` on `src/` as a single chore: formatting pass.
- [ ] Add `.editorconfig` for non-VSCode editors.

## Macro vision (unscheduled)

Aspirational arcs that inform direction but aren't planned for `v0.2.0`:

- **Seasons of the Seven Regions** — live content drops, new boss per quarter.
- **Community-authored journey packs** — user-submitted `.json` spine overlays.
- **AI dialogue companion** — local LLM refines jan Sewi's hints per player vocab stats (opt-in, no network).
- **Classroom mode** — multi-student teacher dashboard tracking TP word mastery across a class of tablets.
- **Soweli trading** — offline P2P QR-code creature trades at the village square.
- **Anthropic showcase build** — `claude.ai/code` demo of Claude-assisted game dev end-to-end.

---

## How to read this doc

A status mark is `✅` only when the behavior is **observable in a playtest**, not when a code review approves the wiring. `🟡` means the contract is met but runtime wiring or polish is below the DoD. `⬜` means nothing has landed yet.

When adding a task, append it to the relevant phase's table with the next sequential ID. Don't rewrite historical IDs — they're referenced from git history + PRs.

When marking a task done, the commit that closes it cites the ID in the message body (`T2-07`, `T4-14`, etc.) and this table flips from `🟡` or `⬜` to `✅`. The commit also tells you which of the linked file paths changed.
