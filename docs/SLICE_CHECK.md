---
title: Playable Slice Checklist
updated: 2026-04-19
status: current
domain: quality
---

# poki soweli — Playable Slice Checklist

Manual QA pass for the Phase 1 vertical slice (roadmap §1, US-014). Run
this against a **fresh save** before every PR that touches field, combat,
or save-flow code. Time budget: under 3 minutes end-to-end.

## Setup

```bash
make build        # regenerate content/generated/*.tres
make run          # or godot --path . --run-editor
```

Or open the Godot editor and hit Play.

## The Loop

- [ ] **Boot**: title screen appears with "new game" focused, no console errors
- [ ] **Starter ceremony**: jan Sewi dialog plays 3–5 beats, offers three lettered starters (A/B/C)
- [ ] **Starter grant**: after ceremony, P opens party panel and shows exactly one creature (the one picked) at L5, 3× poki_lili in inventory
- [ ] **Walk to nasin_wan**: follow the south warp tile into the forest route
- [ ] **Transition shows destination label**: "nasin wan" flashes during the cover screen (US-036)
- [ ] **Tall-grass encounter**: walking through painted tall-grass tiles triggers a wild battle within a few steps
- [ ] **Combat opens**: UI themed in toki amber/emerald, HP bar animates, sprite distinct per species (US-018)
- [ ] **Damage numbers**: pop above target on hit, super-effective in emerald / resisted in grey (US-017)
- [ ] **Faint animation**: defeated battler fades + slides down (US-020)
- [ ] **Catch UX**: throwing a poki shows an arc + flash; result dialog announces caught / escaped before the XP tally (US-023)
- [ ] **Victory panel**: shows "+N xp", level-up if crossed, "+N ma" reward (US-027 / US-059)
- [ ] **Pokedex updates**: after a catch, Pause → Pokedex shows the new species with ✓ (US-055)
- [ ] **Rival set-piece**: step on (30,5) at the east edge — jan Ike fires a scripted battle, flee is blocked, flag persists across save/load
- [ ] **Defeat**: intentionally lose a fight — "pakala!" dialog auto-advances after 2s, HP restored at village (US-022)
- [ ] **Quit + resume**: Cmd-Q (or window close) → relaunch → Continue button restores region + tile + party + inventory
- [ ] **Pause menu**: Esc opens overlay, Settings/Party/Pokedex/Badges/Mastered-words all open + close cleanly
- [ ] **Settings**: slide Music to 0 silences the bus; slide Text speed to 120 obviously speeds up dialog (US-035)

## No-go conditions

If ANY of these happen on the slice path, **do not merge** until resolved:

- Stray console parser/compile errors during play
- Softlock (cannot reach next step of the loop)
- Save round-trip loses party / inventory / region / tile
- Combat UI renders in Godot's default blue-gray (theme not applied)
- Dialog prints raw English when toki-pona is available (`validate_tp` should catch this in CI — but eyeball it anyway)

## Regressions to watch

These have been flaky in the past:

- First HP loss of combat not triggering the damage shake (fixed in US-016; reviewer flagged it once; re-verify)
- Continue warping to (0,0) instead of saved tile when player_tile was never written
- Dialogic 4.6 subsystem_text runtime warning (custom DialogOverlay sidesteps it; warn if it reappears)

## Completion

When every box above ticks on a single run-through of a fresh save,
**US-014 passes** and Phase 1's vertical slice is demoable.
