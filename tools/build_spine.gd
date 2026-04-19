@tool
extends SceneTree

# Read every spine JSON under res://content/spine/ and emit Godot .tres
# Resources under res://content/generated/. Authors edit JSON; everything
# downstream reads .tres.
#
# Run from CI / CLI:
#   godot --headless --path . --script res://tools/build_spine.gd
#
# The emitted world.tres is the single entry point — it holds references
# to every region/species/move/item resource.

const SPINE_DIR := "res://content/spine"
const OUT_DIR := "res://content/generated"
const TP_FIELDS := ["name", "description", "text"]  # dicts with en/tp to enrich


func _init() -> void:
	print("[build_spine] starting")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR + "/species"))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR + "/moves"))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR + "/items"))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR + "/regions"))

	var tatoeba := TatoebaClient.new(true)  # offline — trust validate_tp ran

	var species_ids := _build_kind("species", tatoeba, func(d): return SpeciesResource.from_dict(d))
	var move_ids := _build_kind("moves", tatoeba, func(d): return MoveResource.from_dict(d))
	var item_ids := _build_kind("items", tatoeba, func(d): return ItemResource.from_dict(d))
	var region_ids := _build_kind("regions", tatoeba, func(d): return RegionResource.from_dict(d))

	# Assemble top-level WorldResource pointing at everything we just saved.
	var world := WorldResource.new()
	world.schema_version = 1
	world.title_en = "Toki Town"
	world.start_region_id = _read_start_region_id()

	for id in species_ids:
		var r = load("%s/species/%s.tres" % [OUT_DIR, id])
		if r is SpeciesResource: world.species.append(r)
	for id in move_ids:
		var r = load("%s/moves/%s.tres" % [OUT_DIR, id])
		if r is MoveResource: world.moves.append(r)
	for id in item_ids:
		var r = load("%s/items/%s.tres" % [OUT_DIR, id])
		if r is ItemResource: world.items.append(r)
	for id in region_ids:
		var r = load("%s/regions/%s.tres" % [OUT_DIR, id])
		if r is RegionResource: world.regions.append(r)

	var err := ResourceSaver.save(world, "%s/world.tres" % OUT_DIR)
	if err != OK:
		push_error("[build_spine] failed to save world.tres: %s" % error_string(err))
		quit(1)

	print("[build_spine] ✓ %d species, %d moves, %d items, %d regions → %s/world.tres" % [
		species_ids.size(), move_ids.size(), item_ids.size(), region_ids.size(), OUT_DIR,
	])
	quit(0)


func _build_kind(kind: String, tatoeba: TatoebaClient, factory: Callable) -> Array[String]:
	var ids: Array[String] = []
	var in_dir := "%s/%s" % [SPINE_DIR, kind]
	var da := DirAccess.open(in_dir)
	if da == null:
		print("[build_spine]   no %s/ dir — skipping" % kind)
		return ids
	da.list_dir_begin()
	while true:
		var name := da.get_next()
		if name == "": break
		if name.begins_with("."): continue
		if not name.ends_with(".json"): continue
		var path := "%s/%s" % [in_dir, name]
		var f := FileAccess.open(path, FileAccess.READ)
		if f == null: continue
		var parsed = JSON.parse_string(f.get_as_text())
		f.close()
		if not (parsed is Dictionary):
			push_warning("[build_spine] skipping non-dict JSON: %s" % path)
			continue
		# Fill in TP translations from the cache.
		_enrich_translations(parsed, tatoeba)
		var resource: Resource = factory.call(parsed)
		if resource == null or resource.id == "":
			push_warning("[build_spine] skipping resourceless entry: %s" % path)
			continue
		var out := "%s/%s/%s.tres" % [OUT_DIR, kind, resource.id]
		var err := ResourceSaver.save(resource, out)
		if err != OK:
			push_error("[build_spine] save failed: %s (err=%s)" % [out, error_string(err)])
			continue
		ids.append(resource.id)
	da.list_dir_end()
	ids.sort()
	return ids


# Walk the JSON tree and replace any `{en: "..."}` dict missing a tp with
# the first cached Tatoeba variant. Doesn't hit network (offline client).
func _enrich_translations(obj, tatoeba: TatoebaClient) -> void:
	if obj is Array:
		for item in obj: _enrich_translations(item, tatoeba)
		return
	if not (obj is Dictionary): return
	if obj.get("en") is String and not (obj.get("tp", "") is String and obj.get("tp", "") != ""):
		var en := String(obj["en"])
		# Skip single-word (dictionary-exempt) — caller decides.
		if " " in en.strip_edges():
			var variants := tatoeba.lookup(en)
			if variants.size() > 0:
				obj["tp"] = String(variants[0])
	for k in obj.keys():
		_enrich_translations(obj[k], tatoeba)


func _read_start_region_id() -> String:
	# Read content/spine/world.json if it exists; otherwise fall back.
	var path := "%s/world.json" % SPINE_DIR
	if not FileAccess.file_exists(path):
		return "ma_tomo_lili"
	var f := FileAccess.open(path, FileAccess.READ)
	var parsed = JSON.parse_string(f.get_as_text())
	f.close()
	if parsed is Dictionary:
		return String(parsed.get("start_region_id", "ma_tomo_lili"))
	return "ma_tomo_lili"
