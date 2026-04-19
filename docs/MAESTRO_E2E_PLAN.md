---
title: Maestro E2E automation
updated: 2026-04-19
status: current
domain: quality
---

# Maestro E2E

We use [Maestro](https://maestro.mobile.dev/) to exercise the Android debug
APK on a real emulator as a smoke + regression layer above the Godot unit
tests. Every PR that touches GDScript, scenes, theme, or the Android export
preset runs the smoke flow via `.github/workflows/maestro.yml`.

Conceptually modelled on `../ashworth-manor/docs/MAESTRO_E2E_PLAN.md`, but
simplified because poki-soweli's input surface is 2D UI + a top-down tilemap
overworld rather than a full 3D scene with `Camera3D.unproject_position`.

## Pipeline

```
1. godot --headless --export-debug "Android Debug Helper" build/android/poki-soweli-debug.apk
2. emulator -avd poki_test -no-window -no-audio &
3. adb wait-for-device && adb install build/android/poki-soweli-debug.apk
4. maestro test test/maestro/
5. Screenshots + pass/fail report uploaded as CI artifact
```

The "Android Debug Helper" preset already bakes in
`command_line/extra_args="--maestro-helper --rendering-driver opengl3 --rendering-method gl_compatibility"`,
so launching the debug APK on device is enough to make the helper active.

## Helper autoload

`scripts/debug/maestro_helper.gd` is wired as the `MaestroHelper` autoload
in `project.godot`. On `_enter_tree()` it self-deletes unless the
`--maestro-helper` flag is present, so release builds pay zero cost.

When active it adds three invisible (alpha 0.02) overlay labels to the
scene-tree root that Maestro's OCR path can read:

| Label           | Purpose                                              |
|-----------------|------------------------------------------------------|
| `Maestro Helper`| Presence check — fail-fast signal that flows are running against a debug build |
| `Scene: <name>` | Name of the current top-level scene, updated 2×/sec  |
| `Room: <name>`  | Overworld room/location name when available (walks `Overworld` singleton) |

On top of those persistent labels, the helper walks the active scene
each `1/10s` for nodes with a `maestro_id` meta. For each tagged node it
projects the world position through the active `Camera2D` and drops an
invisible label at the corresponding screen coordinate. Maestro flows
can then do `tapOn: "shop_entrance"` instead of pixel coordinates that
break when the camera moves or the layout changes.

### Tagging interactables

In a `.tscn`:

```gdscript
# As a metadata override in the inspector:
metadata/maestro_id = "shop_entrance"
```

In code:

```gdscript
my_area.set_meta("maestro_id", "shop_entrance")
```

The ID becomes the OCR-visible label. Keep IDs short, stable, and flow-
facing (`npc_soweli`, `battle_trigger_forest`, `door_inside_house`).

## Writing flows

Flows live at `test/maestro/*.yaml`. All flows share the `appId`
`com.arcadecabinet.pokisoweli` from `test/maestro/config.yaml`.

Conventions:

- Start every flow with `launchApp: stopApp: true` so we never inherit
  state from a previous run.
- Immediately wait for `Maestro Helper` to be visible — if it isn't, the
  flow is pointed at a release build and should fail before doing damage.
- Prefer `extendedWaitUntil` over `waitForAnimationToEnd` so flakiness
  surfaces as a timeout with a screenshot rather than a race that works
  on the dev's machine and hangs in CI.
- Screenshot to `screenshots/maestro/<flow>_<step>` on every meaningful
  state change. CI uploads the directory as an artifact.
- End flows with `stopApp` so emulator state resets between tests.

## Running locally

```bash
# From repo root:
./scripts/maestro-run.sh

# Specific flow only:
MAESTRO_FLOWS=test/maestro/smoke_test.yaml ./scripts/maestro-run.sh

# Against an existing emulator/device:
MAESTRO_KEEP_APP=1 ./scripts/maestro-run.sh
```

Prerequisites:

- Godot 4.6 on PATH.
- Android SDK with `platform-tools`, `emulator`, and a system-image
  matching the AVD (or use the CI default: `system-images;android-34;google_apis;x86_64`).
- `maestro` CLI: `brew install maestro`.
- An AVD named `poki_test` (override with `MAESTRO_AVD=<name>`).

## CI

The Maestro run lives inside `.github/workflows/ci.yml` as a `maestro` job
downstream of `build-android-debug`. Keeping it in the same file as every
other PR check means one status list on the PR, and we reuse the debug
APK artifact the build step already produces instead of rebuilding inside
the emulator job.

Emulator: `api-level=34, arch=x86_64, target=google_apis, profile=pixel_6`
via [`reactivecircus/android-emulator-runner`](https://github.com/ReactiveCircus/android-emulator-runner),
which handles AVD creation, boot, and animation-disabling.

Screenshots are uploaded as a CI artifact named
`maestro-screenshots-<PR-#>` with 14-day retention.

## Known limitations

- 2D-only coverage right now. If a future scene uses `Camera3D`, extend
  the helper with an `unproject_position` branch (mirror the
  ashworth-manor helper).
- Release APKs don't include the helper. Running Maestro against a
  release build will timeout waiting for the `Maestro Helper` label —
  that's intentional.
- The tag-match pattern in the helper only considers the active scene's
  sub-tree. Nodes parented to the root (autoloads, floating overlays)
  are not walked. If that becomes a pain point, broaden `_collect_tagged`
  to also include `get_tree().root.get_children()`.
