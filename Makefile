# poki soweli — developer convenience targets.
#
# `make validate` runs the TP writing-rules + Tatoeba cache check.
# `make build` compiles spine JSON → .tres Godot resources.
# `make test` runs gdUnit4 headless.
# `make run` opens the game in the editor.
#
# All targets shell out to Godot. No Node, no pnpm, no Vite.

GODOT ?= /Applications/Godot.app/Contents/MacOS/Godot
PROJECT := $(CURDIR)

.PHONY: validate validate-online build test run import clean-cache seed-cache editor

validate:
	$(GODOT) --headless --path $(PROJECT) --script res://tools/validate_tp.gd -- --offline

validate-online:
	$(GODOT) --headless --path $(PROJECT) --script res://tools/validate_tp.gd

build:
	$(GODOT) --headless --path $(PROJECT) --script res://tools/build_spine.gd

test:
	$(GODOT) --headless --path $(PROJECT) -s addons/gdUnit4/bin/GdUnitCmdTool.gd -a test/

run editor:
	$(GODOT) --path $(PROJECT) -e

import:
	$(GODOT) --headless --path $(PROJECT) --import

seed-cache:
	$(GODOT) --headless --path $(PROJECT) --script res://tools/seed_cache_from_tatoeba.gd

clean-cache:
	rm -rf .godot/
