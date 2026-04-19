@tool
extends SceneTree

# One-shot: seed res://content/corpus/cache.json from the existing
# vendored tatoeba.json (37k tok-eng pairs) so validate_tp / build_spine
# never need a live API call for any sentence already in the dataset.
#
# Run once, then delete tatoeba.json. From here forward the API is only
# consulted for EN lines authors add that aren't already in the cache.
#
# Usage:
#   godot --headless --path . --script res://tools/seed_cache_from_tatoeba.gd

const SOURCE := "res://content/corpus/tatoeba.json"
const CACHE := "res://content/corpus/cache.json"


func _init() -> void:
	if not FileAccess.file_exists(SOURCE):
		print("[seed_cache] tatoeba.json missing — nothing to seed")
		quit(0)
		return

	var f := FileAccess.open(SOURCE, FileAccess.READ)
	var parsed = JSON.parse_string(f.get_as_text())
	f.close()
	if not (parsed is Array):
		push_error("[seed_cache] tatoeba.json is not an Array")
		quit(1)
		return

	var by_en: Dictionary = {}
	var added := 0
	for entry in parsed:
		if not (entry is Dictionary): continue
		var en := String(entry.get("en", ""))
		var tp := String(entry.get("tp", ""))
		if en.length() == 0 or tp.length() == 0: continue
		var key := TatoebaClient.normalize(en)
		if key.length() == 0: continue
		if not by_en.has(key):
			by_en[key] = [] as Array
			added += 1
		if not (tp in by_en[key]):
			by_en[key].append(tp)

	# Sort for diff friendliness.
	var keys := by_en.keys()
	keys.sort()
	var sorted := {}
	for k in keys:
		sorted[k] = by_en[k]

	var out := FileAccess.open(CACHE, FileAccess.WRITE)
	if out == null:
		push_error("[seed_cache] cannot open cache for write")
		quit(1)
		return
	out.store_string(JSON.stringify(sorted, "  "))
	out.close()

	print("[seed_cache] ✓ wrote %d unique EN keys from %d Tatoeba pairs → %s" % [
		by_en.size(), parsed.size(), CACHE,
	])
	quit(0)
