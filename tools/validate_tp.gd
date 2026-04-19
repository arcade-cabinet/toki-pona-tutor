@tool
extends SceneTree

# Validate all authored content in res://content/spine/ against the
# writing rules (complexity scorer) and Tatoeba corpus (live API, cached).
#
# Run from CI / CLI:
#   godot --headless --path . --script res://tools/validate_tp.gd
# Or with offline mode (cache only, no network):
#   godot --headless --path . --script res://tools/validate_tp.gd -- --offline
#
# Exits 0 on success, 1 on any validation failure.

const SPINE_DIR := "res://content/spine"


func _init() -> void:
	# Parse --offline flag.
	var args := OS.get_cmdline_user_args()
	var offline := "--offline" in args

	print("[validate_tp] starting (offline=%s)" % offline)
	var scorer := ComplexityScorer.new()
	var tatoeba := TatoebaClient.new(offline)

	var checked := 0
	var errors := 0
	var complexity_flags := 0
	var corpus_misses := 0
	var hits := 0

	var files := _walk_json(SPINE_DIR)
	print("[validate_tp] scanning %d file(s) under %s" % [files.size(), SPINE_DIR])

	for path in files:
		var f := FileAccess.open(path, FileAccess.READ)
		if f == null:
			push_error("[validate_tp] cannot read %s" % path)
			errors += 1
			continue
		var text := f.get_as_text()
		f.close()
		var parsed = JSON.parse_string(text)
		if parsed == null:
			push_error("[validate_tp] invalid JSON at %s" % path)
			errors += 1
			continue

		var pairs: Array = []
		_collect_pairs(parsed, path.replace("res://", ""), pairs)

		for pair in pairs:
			var en: String = pair.en
			if _is_single_word(en):
				continue  # dictionary-exempt
			checked += 1

			# Complexity scorer runs first — if the line violates the
			# writing rules, rewriting EN is cheaper than querying an
			# API for an unlikely match.
			var s := scorer.score(en)
			if not s.passes():
				errors += 1
				complexity_flags += 1
				var reasons_str := "; ".join(s.reasons) if s.reasons.size() > 0 else ""
				printerr("\n[validate_tp] COMPLEXITY %s (rank %d/100)" % [pair.path, s.rank])
				printerr("  EN: \"%s\"" % en)
				if reasons_str.length() > 0:
					printerr("  %s" % reasons_str)
				printerr("  See docs/WRITING_RULES.md — target rank ≤ %d." % ComplexityScorer.CEILING)
				continue

			# Corpus check.
			var tp_variants := tatoeba.lookup(en)
			if tp_variants.is_empty():
				errors += 1
				corpus_misses += 1
				printerr("\n[validate_tp] NO CANONICAL TP %s" % pair.path)
				printerr("  EN: \"%s\"" % en)
				printerr("  Tatoeba has no tok-eng pair for this line.")
				printerr("  Rewrite the English or drop the line.")
				continue

			# If the author already wrote a TP, it must be in the
			# accepted variant set.
			if pair.tp.length() > 0:
				if not pair.tp in tp_variants:
					errors += 1
					printerr("\n[validate_tp] NONCANONICAL TP %s" % pair.path)
					printerr("  EN: \"%s\"" % en)
					printerr("  TP authored: %s" % pair.tp)
					printerr("  Accepted TP for this EN:")
					for v in tp_variants:
						printerr("    - %s" % v)
					continue

			hits += 1

	# Persist any cache growth.
	tatoeba.save_cache()

	if errors > 0:
		printerr("\n[validate_tp] %d/%d line(s) failed (complexity=%d, corpus_miss=%d)" % [
			errors, checked, complexity_flags, corpus_misses,
		])
		quit(1)
	else:
		print("[validate_tp] ✓ %d multi-word translatable(s) canonical across %d file(s)" % [
			checked, files.size(),
		])
		quit(0)


# Walk res://content/spine/ recursively, return absolute res:// paths of
# every .json file.
func _walk_json(dir_path: String) -> Array[String]:
	var out: Array[String] = []
	var da := DirAccess.open(dir_path)
	if da == null:
		push_warning("[validate_tp] cannot open %s" % dir_path)
		return out
	da.list_dir_begin()
	while true:
		var name := da.get_next()
		if name == "":
			break
		if name.begins_with("."):
			continue
		var full := dir_path.path_join(name)
		if da.current_is_dir():
			out.append_array(_walk_json(full))
		elif name.ends_with(".json"):
			out.append(full)
	da.list_dir_end()
	return out


# Walk a parsed JSON tree and collect every `{en, tp?}` pair, preserving
# the dotted path to where it appeared so errors point at a location.
func _collect_pairs(obj, trail: String, out: Array) -> void:
	if obj == null:
		return
	if obj is Array:
		for i in obj.size():
			_collect_pairs(obj[i], "%s[%d]" % [trail, i], out)
		return
	if obj is Dictionary:
		if obj.get("en") is String:
			var rec := {
				"en": String(obj["en"]),
				"tp": String(obj.get("tp", "")),
				"path": trail,
			}
			out.append(rec)
		for k in obj.keys():
			_collect_pairs(obj[k], "%s.%s" % [trail, String(k)], out)


static func _is_single_word(s: String) -> bool:
	var trimmed := s.strip_edges()
	if trimmed.length() == 0: return false
	return not " " in trimmed
