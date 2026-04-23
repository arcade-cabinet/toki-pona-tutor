---
title: 1.0 Onboarding Capture
updated: 2026-04-23
status: current
domain: quality
---

# 1.0 Onboarding Capture

Automated playthrough of the boot surface via `tests/e2e/full/onboarding-capture.spec.ts`. The PNGs are evidence; the fluency verdict lives in this file.

## Headline finding — the landing/gameplay quality cliff

**The landing page is premium polish. The gameplay area is raw placeholder.** Going from frame 01 (title) to frame 03 (post-title-click) is the single most damaging first-impression moment in the current build — the drop in quality is staggering and will cost players in the first 30 seconds. Every other v1 priority is subordinate to closing this gap.

## Frames + fluency verdicts

### Frame 01 — Title screen — **POLISHED**

Evidence: `01-title.png`.

- Typography ladder is clear (brand serif + supporting sans).
- Tagline is specific and evocative: "Catch strange companions, follow old clues, and uncover the green dragon's trail across a hand-built fantasy frontier."
- Card chrome (parchment + warm cream) is on-brand per `docs/BRAND.md`.
- Three descriptor chips (CREATURE-CATCHING / MYSTERY QUESTS / TAP-FIRST PLAY) set expectations.
- "Fold kit ready" action card with New Game / Settings / Quit and a clear primary CTA.
- Meta footnote: "Built for mouse, keyboard shortcuts, and touch."

Intent ✓ · Options ✓ · Feedback ✓ · Memory ✓

### Frame 02 — Title with New Game focused — **POLISHED**

Evidence: `02-title-menu.png`. Same polish as frame 01. Hover state is legible.

### Frame 03 — First moment of gameplay — **UNFLUENT (v1 blocker)**

Evidence: `03-post-title-click.png` (also true for frames 04-06; the PNG bytes are identical).

**Blockers surfaced by this single frame:**

1. **No player character is distinguishable.** Five NPCs on screen with similar sprite styles; if one is Rivers, no visual affordance (glowing outline, directional indicator, name label) identifies which body the player controls. A new player literally cannot locate themselves.
2. **Raw black placeholder rectangles** on the grass (top + bottom). These look like tree/rock sprites that either failed to load or are still source placeholders. In a polished 16-bit RPG, trees have outlines and shading; these are rectangles.
3. **Unexplained brown square** in the middle of the path. Reads as "put something here later." No label, no outline, no interaction hint.
4. **Zero gameplay HUD.** The star icon top-right is the only overlay chrome. No goal/quest text, no party count, no region name, no "press Space to interact" hint. The player has no anchor.
5. **No diegetic onboarding.** The landing page promised a starter ceremony with jan Sewi — the actual map has NPCs but no visible "talk to me first" cue. A new player wanders.
6. **Tile-aesthetic cliff.** The landing-page illustration suggests a painted hand-built world; the gameplay tiles are flat-color pixel blocks. They live in different games visually.

Intent ✗ · Options ✗ · Feedback ✗ (no player visible = no feedback loop) · Memory ✓ (memorable in a bad way)

### Frames 04-06 — Movement attempts — **NO VISIBLE RESPONSE**

Evidence: the PNG bytes for 04/05/06 are **byte-identical** to 03, despite sending ArrowRight, ArrowRight, ArrowDown between each snap. Two possibilities:

- Key events aren't reaching the engine (input routing bug in the preview path)
- The player sprite moves but is off-screen / invisible / blocked so the visible frame doesn't change

Either way, the first diagnostic a new player has for "am I in control" fails. Critical severity regardless of root cause.

### Frame 07 — Pause overlay — **FUNCTIONAL BUT SPARSE**

Evidence: `07-pause-overlay.png`.

- Menu chrome renders with the brand parchment palette.
- Navigation: Party 0/6, Clues, Gear, Bestiary, Settings, plus Save and Title footer buttons.
- Right-pane is empty by default — no "current goal" summary, no next-region hint, no quest progress at a glance.
- **Party shows 0/6** after the starter ceremony should have handed the player their first companion. This confirms the engine path from title-click → starter-ceremony → first companion isn't firing.

Intent ~ · Options ✓ · Feedback ✗ (empty party after supposedly choosing a starter is a hard bug) · Memory ~

## Root-cause hypothesis

Post-title-click routing: clicking New Game on the overlay does not fire the starter ceremony dialog or hand the player their first companion. The player drops directly onto the starter map with an empty party, no Rivers-sprite differentiation, and no quest gate. Either:

1. The overlay's New Game button isn't wired to the engine's `starter_mentor` event, or
2. `jan-sewi` (the starter mentor on `riverside_home`) doesn't auto-trigger on first arrival and requires a player-initiated interaction that the player has no way to know about yet

Both are fixable. Both are v1 blockers.

## North-star reminder — story is the asset that lasts

The reference points for this project are not the graphics of modern AAA RPGs; they are the narrative depth of 16-bit classics. **Pokémon Blue, Final Fantasy VI, Chrono Trigger** — none of them are remembered for pixel fidelity. They are remembered because the *first thirty minutes of play* establish a world with stakes, a protagonist with a reason to leave home, and a motive to keep going. Pokémon Blue opens with Professor Oak telling you a story about a dangerous world. Final Fantasy VI opens with a scripted march. Chrono Trigger opens with a bell ringing in Leene Square and a friend waiting to meet you. The graphics were never the hook; the opening was.

Rivers Reckoning's current opening gives the player a map with NPCs and no instruction. That is the opposite of what this genre's 30-year playbook says to do. The fix is not a tileset upgrade — it's a scripted opening that stages Rivers's first steps as a narrative beat, not a character-controller test.

Every P0 below is in service of that thesis: depth of play before depth of pixels.

## Architectural root cause — no agency, no scripted moments

Beyond the visual cliff there is a deeper problem: **the world has no agency**. RPG.js ships everything needed for cold opens — event triggers, forced dialog, camera pans, NPC pathing, scene commands, cutscene flags — and we use none of them for the opening. The player is dropped into `riverside_home` as if they were resuming a save, not starting the story of Rivers.

The opening 30 seconds of an RPG *is* the world, in miniature. Every best-in-class creature-catcher opens with a scripted scene that answers three questions before the player presses a single movement key:

- **Why is Rivers here?** A scripted beat that stages Rivers in their home, called by Elder Selby, given a reason to leave.
- **Why does Rivers care?** A visible stake — something is wrong (tracks on the river, a villager missing, an ominous sound from upstream) — so "go catch creatures" has narrative weight beyond mechanics.
- **Why does the player want to go on?** A clear, scripted first objective that fades in as a quest goal ("Talk to Elder Selby" → "Choose your starter" → "Head east").

The current build uses Yuka (AI steering) and a full event system, but no piece of the opening sequence is scripted. Every one of these is a plain RPG.js API call that the pivot left behind:

- `RpgPlayer.onConnected` → force a camera pan to Selby before giving the player control
- `startInScene(...)` or `lockInput(true)` → make the opening a cutscene, not a free-roam
- `showText(...)` / `showChoices(...)` → the Selby ceremony is a single multi-line dialog tree, not an implicit interaction the player must discover
- Event `onAutoStart` → a tall-grass rustle in the north edge of the map that auto-fires on first approach, seeding the "something is wrong" hook

The fix isn't docs. The fix isn't more quest JSON. The fix is writing `src/modules/main/opening-scene.ts` that owns the scripted first-run arc end-to-end, using the RPG.js primitives we already pay for.

## Open issues — each becomes a ROADMAP row

1. **T11-01 Landing→gameplay quality cliff is a v1 blocker.** Coming out of a premium landing, the gameplay canvas needs polish of a commensurate bar before anything else ships. **P0.**
2. **T11-02 Player sprite has no visual differentiation from NPCs.** A name plate, outline, directional indicator, or dedicated palette must distinguish Rivers. **P0.**
3. **T11-03 Black rectangle placeholders on riverside_home.** Some object tiles (trees? rocks?) render as raw black boxes. Trace: map spec, tileset, or runtime fetch failure. **P0.**
4. **T11-04 Unexplained brown square in the middle of starter village.** Either label it (signpost / well / chest) or remove it. **P1.**
5. **T11-05 No HUD on active gameplay surfaces.** Bring goal/quest/party/region chrome onto the gameplay canvas — the landing-page UI language exists; use it. **P0.**
6. **T11-06 New-Game click doesn't fire the starter ceremony.** Clicking New Game should trigger jan Sewi's starter-choice dialog, not drop the player on an empty map. **P0.**
7. **T11-07 Party stays at 0/6 after entering gameplay.** Either the starter grant never fires, or the overlay doesn't read persistence fast enough. Trace. **P0.**
8. **T11-08 Movement input doesn't visibly change the canvas.** Is the player moving off-screen, blocked at spawn, or is input not routed? **P0.**
9. **T11-09 Pause-overlay right-pane is empty by default.** Show an at-a-glance dashboard on pause: active goal, current quest progress, next region gate, recent catches. **P1.**
10. **T11-10 No diegetic onboarding.** A visible, unskippable-at-first-play cue tells the player what to do for the first 30 seconds (e.g., jan Sewi glows and has a "!"). **P0.**
11. **T11-11 Write the opening scene.** New module `src/modules/main/opening-scene.ts` that, on first connect with no save, locks input, pans the camera to Selby, plays a scripted dialog ("Rivers, it's time — your capture pods are on the table"), fades in the first quest gate, and returns control. Then a scripted tall-grass rustle on the north edge plants the dragon hook before the player reaches it. This is the Pokémon/FF6/Chrono Trigger 30-seconds-in-the-world opener. **P0.**

## Recommendation for the next batch

Ship a **visual-polish sprint** dedicated to closing the landing→gameplay cliff. This is NOT docs work and NOT content authoring — it is runtime UX work that touches `src/ui/`, `src/modules/main/starter-ceremony.ts`, `src/content/gameplay/events.json`, and `scripts/map-authoring/specs/riverside_home.ts`. Gate each fix on a rerun of `tests/e2e/full/onboarding-capture.spec.ts` and a visible improvement in the captured frames.

Every T11-0x row above maps to a ROADMAP task and a dedicated PR.

## Capture frames (committed alongside this file)

- `01-title.png` — title screen (polished baseline)
- `02-title-menu.png` — title with New Game focused
- `03-post-title-click.png` — immediately after clicking New Game (unfluent)
- `04-starter-ceremony-entry.png` — byte-identical to 03 (starter ceremony didn't fire)
- `05-starter-map-idle.png` — byte-identical to 03
- `06-after-movement.png` — byte-identical to 03 (movement input did not change the canvas)
- `07-pause-overlay.png` — pause menu with empty party
