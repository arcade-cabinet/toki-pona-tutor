class_name WorldResource
extends Resource

# The compiled world — every region, species, move, item collected after
# build_spine.gd runs. Authors never edit this file directly. Emitted to
# content/generated/world.tres.

@export var schema_version: int = 1
@export var title_en: String = "poki soweli"
@export var title_tp: String = ""
@export var start_region_id: String = ""

@export var species: Array[SpeciesResource] = []
@export var moves: Array[MoveResource] = []
@export var items: Array[ItemResource] = []
@export var regions: Array[RegionResource] = []

# Main-quest spine — ordered beat list.
# Array of dicts {id: String, summary: String}
@export var main_spine: Array = []


# Lookups — O(N) walk, fine at this scale.
func find_species(id: String) -> SpeciesResource:
	for s in species:
		if s.id == id: return s
	return null


func find_move(id: String) -> MoveResource:
	for m in moves:
		if m.id == id: return m
	return null


func find_item(id: String) -> ItemResource:
	for it in items:
		if it.id == id: return it
	return null


func find_region(id: String) -> RegionResource:
	for r in regions:
		if r.id == id: return r
	return null
