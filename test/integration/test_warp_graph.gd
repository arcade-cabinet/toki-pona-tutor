## test_warp_graph.gd — verifies every authored region is reachable
## via the warp graph starting from the world.start_region_id, catches
## orphans and self-loops in the region data. US-050 / US-081.
extends GdUnitTestSuite


const WORLD_PATH := "res://content/generated/world.tres"


func _load_world() -> WorldResource:
	assert_that(ResourceLoader.exists(WORLD_PATH)).is_true()
	var res = ResourceLoader.load(WORLD_PATH)
	assert_that(res is WorldResource).is_true()
	return res


func test_start_region_exists() -> void:
	var w := _load_world()
	assert_that(w.start_region_id).is_not_equal("")
	var start := w.find_region(w.start_region_id)
	assert_that(start).is_not_null()


func test_all_regions_reachable_from_start() -> void:
	var w := _load_world()
	var reachable: Dictionary = {}
	var queue: Array = [w.start_region_id]
	while not queue.is_empty():
		var id: String = queue.pop_front()
		if reachable.has(id): continue
		reachable[id] = true
		var region := w.find_region(id)
		if region == null: continue
		for warp in region.warps:
			if not (warp is Dictionary): continue
			var to_id := String(warp.get("to_region", ""))
			if to_id != "" and not reachable.has(to_id):
				queue.append(to_id)
	for r in w.regions:
		assert_that(reachable.has(r.id)).override_failure_message(
			"Region '%s' is unreachable from start '%s'" % [r.id, w.start_region_id]
		).is_true()


func test_no_self_loop_warps() -> void:
	var w := _load_world()
	for r in w.regions:
		for warp in r.warps:
			if not (warp is Dictionary): continue
			var to_id := String(warp.get("to_region", ""))
			assert_that(to_id != r.id).override_failure_message(
				"Region '%s' warps to itself — self-loop at tile %s" % [r.id, str(warp.get("tile", "?"))]
			).is_true()


func test_all_warp_targets_exist() -> void:
	var w := _load_world()
	var ids: Dictionary = {}
	for r in w.regions:
		ids[r.id] = true
	for r in w.regions:
		for warp in r.warps:
			if not (warp is Dictionary): continue
			var to_id := String(warp.get("to_region", ""))
			if to_id == "": continue
			assert_that(ids.has(to_id)).override_failure_message(
				"Region '%s' warps to unknown region '%s'" % [r.id, to_id]
			).is_true()
