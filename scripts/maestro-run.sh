#!/usr/bin/env bash
# Drive a full Maestro E2E cycle against a fresh debug APK.
#
# Steps:
#   1. Build the "Android Debug Helper" APK with --maestro-helper embedded.
#   2. Start (or reuse) an Android emulator named poki_test.
#   3. Install the APK, launch it cold.
#   4. Run every flow under test/maestro/.
#   5. Surface Maestro's exit code unchanged.
#
# Requires:
#   - Godot 4.6 on PATH
#   - Android SDK with platform-tools, emulator, and a system-image matching
#     the AVD below (pick one that exists on the host; override with
#     MAESTRO_AVD=<name>).
#   - maestro CLI on PATH (brew install maestro).
#
# Environment overrides:
#   MAESTRO_AVD          AVD name (default poki_test)
#   MAESTRO_APK          Output APK path (default build/android/poki-soweli-debug.apk)
#   MAESTRO_FLOWS        Flow directory or file (default test/maestro)
#   MAESTRO_KEEP_APP     If 1, don't uninstall between runs
#
# Usage:
#   scripts/maestro-run.sh                       # full cycle
#   MAESTRO_FLOWS=test/maestro/smoke_test.yaml scripts/maestro-run.sh

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$here"

AVD_NAME="${MAESTRO_AVD:-poki_test}"
APK_PATH="${MAESTRO_APK:-build/android/poki-soweli-debug.apk}"
FLOWS="${MAESTRO_FLOWS:-test/maestro}"
APP_ID="com.arcadecabinet.pokisoweli"

log() { printf '\033[1;34m[maestro-run]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[maestro-run]\033[0m %s\n' "$*" >&2; exit 1; }

command -v godot >/dev/null 2>&1 || die "godot not on PATH"
command -v adb >/dev/null 2>&1 || die "adb not on PATH — install Android platform-tools"
command -v emulator >/dev/null 2>&1 || die "emulator not on PATH — install Android SDK emulator package"
command -v maestro >/dev/null 2>&1 || die "maestro not on PATH — brew install maestro"

# ---- 1. Build APK ----
log "Building debug APK with Maestro helper flag embedded"
mkdir -p "$(dirname "$APK_PATH")"
# The "Android Debug Helper" preset bakes in --maestro-helper via
# command_line/extra_args. Using --export-debug keeps the Dialogic-segfault
# exit-code tolerance the CI uses; trust the file on disk.
set +e
godot --headless --path . --export-debug "Android Debug Helper" "$APK_PATH"
godot_rc=$?
set -e
[ -f "$APK_PATH" ] || die "APK was not produced (godot rc=$godot_rc)"
log "APK: $APK_PATH ($(stat -f%z "$APK_PATH" 2>/dev/null || stat -c%s "$APK_PATH") bytes)"

# ---- 2. Emulator ----
if adb devices | awk 'NR>1 && $2=="device"' | grep -q .; then
  log "Reusing already-running Android device"
else
  log "Booting emulator $AVD_NAME (headless)"
  # shellcheck disable=SC2086
  emulator -avd "$AVD_NAME" -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect >/tmp/poki-emu.log 2>&1 &
  adb wait-for-device
  # Block until sys.boot_completed = 1.
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
fi

# ---- 3. Install + launch ----
if [ "${MAESTRO_KEEP_APP:-0}" != "1" ]; then
  log "Uninstalling any previous $APP_ID"
  adb uninstall "$APP_ID" >/dev/null 2>&1 || true
fi
log "Installing $APK_PATH"
adb install -r "$APK_PATH"

# ---- 4. Maestro ----
log "Running Maestro flows from $FLOWS"
maestro test "$FLOWS"
