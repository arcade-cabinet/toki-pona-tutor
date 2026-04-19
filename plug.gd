@tool
extends "res://addons/gd-plug/plug.gd"

# Addon manifest for poki soweli. `gd-plug install` installs the pinned set.
#
# Design direction: warm and cute — not "2play", not dark/edgy. Keep the
# list small and load-bearing. Anything we can do in plain GDScript we do
# in plain GDScript rather than pulling in a dependency.
#
# All addons here are versions already vetted in ashworth-manor (our Godot
# horror project). Versions pinned so CI stays reproducible.

func _plugging() -> void:
	# === TESTING ===
	# Unit + integration testing for Godot 4.
	# CLI:  godot --headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd
	plug("MikeSchulze/gdUnit4", {"tag": "v6.1.2", "include": ["addons/gdUnit4/"]})

	# === DIALOGUE ===
	# Two dialogue systems in-tree:
	#
	#   - addons/dialogic/ — from godot-open-rpg base, more visual / branching
	#   - addons/dialogue_manager/ — from ashworth, text-file-based,
	#     lighter, better for our mostly-linear NPC beats
	#
	# We pick one in week 3 day 1 after a Godot-4.6 smoke test on both. The
	# other gets removed in the same commit. Until then, both live here.
	plug("nathanhoad/godot_dialogue_manager")

	# === INVENTORY ===
	# Grid-based inventory with item database and UI components. Replaces
	# the old dict-based inventory (poki / poki_lili / poki_wawa / kili /
	# telo_pona) with a real slot system.
	plug("peter-kish/gloot")

	# === QUESTS ===
	# Resource-based quest tracker. Replaces our boolean-flag dict
	# (badge_sewi / badge_telo / etc.) with structured quest state + stages.
	plug("shomykohai/quest-system")

	# === SAVE / LOAD ===
	# Robust save system — encryption on release, nested data, error
	# handling. Better than raw ResourceSaver for mobile where storage
	# permissions + corruption recovery matter.
	plug("AdamKormos/SaveMadeEasy")

	# === AI-DRIVEN EDITOR ===
	# Godot MCP Pro exposes 163 editor tools over WebSocket so an AI agent
	# can inspect scenes, run tools/ scripts, launch the game, take
	# screenshots, etc. without a human driving the editor. Authoring-time
	# only; not in release builds.
	# (Not via gd-plug — copied from ashworth's vetted version directly.)
