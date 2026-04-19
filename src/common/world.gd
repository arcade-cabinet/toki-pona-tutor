extends Node

# World autoload — the game's content registry.
#
# Loads res://content/generated/world.tres (produced by build_spine.gd)
# at game startup. Provides typed lookups for region/species/move/item
# so scenes and scripts never hard-code content paths.
#
# Access:
#   World.world.find_region("ma_tomo_lili") -> RegionResource
#   World.world.find_species("soweli_seli") -> SpeciesResource
#   World.start_region_id -> String
#
# If world.tres is missing (fresh clone before `make build`), autoload
# logs a warning and exposes a null world. The main scene handles this
# by showing a "run `make build`" message instead of crashing.

const WORLD_PATH := "res://content/generated/world.tres"

var world: WorldResource = null
var loaded: bool = false


func _ready() -> void:
	_load()


func _load() -> void:
	if not ResourceLoader.exists(WORLD_PATH):
		push_warning("[World] %s not found — run `make build` to generate" % WORLD_PATH)
		return
	var res = ResourceLoader.load(WORLD_PATH)
	if not (res is WorldResource):
		push_error("[World] %s is not a WorldResource" % WORLD_PATH)
		return
	world = res
	loaded = true
	print("[World] loaded %d species, %d moves, %d items, %d regions" % [
		world.species.size(), world.moves.size(),
		world.items.size(), world.regions.size(),
	])


# Convenience accessors — null-safe.
func find_region(id: String) -> RegionResource:
	if not loaded: return null
	return world.find_region(id)


func find_species(id: String) -> SpeciesResource:
	if not loaded: return null
	return world.find_species(id)


func find_move(id: String) -> MoveResource:
	if not loaded: return null
	return world.find_move(id)


func find_item(id: String) -> ItemResource:
	if not loaded: return null
	return world.find_item(id)


var start_region_id: String:
	get: return world.start_region_id if loaded else ""


# Force a reload (e.g. after build_spine runs in-editor). Not normally
# called at runtime.
func reload() -> void:
	loaded = false
	world = null
	_load()
