class_name RegionResource
extends Resource

# A region — one overworld screen's worth of world. Villages, routes,
# mountains, lakes, and peaks are all regions. Authored in
# content/spine/regions/<id>.json; emitted as .tres.

@export var id: String = ""
@export var name_tp: String = ""
@export var name_en: String = ""
@export var description_en: String = ""
@export var description_tp: String = ""

@export var width: int = 20
@export var height: int = 14
@export var sky_color: String = "#8bc260"

# layers[]: Array of dicts {name, tiles: Array[Array[String/null]], solid_keys, depth}
@export var layers: Array = []
@export var tall_grass_keys: Array = []
# encounters[]: Array of dicts {species_id, weight, min_level, max_level}
@export var encounters: Array = []
# npcs[]: Array of NpcResource (built by build_spine)
@export var npcs: Array[NpcResource] = []
# signs[]: Array of dicts {id, tile, text: {en, tp}}
@export var signs: Array = []
# warps[]: Array of dicts {id, tile, to_region, to_tile}
@export var warps: Array = []
# dialog[]: Array of DialogResource
@export var dialog: Array[DialogResource] = []

@export var spawn: Vector2i = Vector2i.ZERO


static func from_dict(d: Dictionary) -> RegionResource:
	var r := RegionResource.new()
	r.id = d.get("id", "")
	r.name_tp = d.get("name_tp", "")
	r.name_en = d.get("name_en", "")
	var desc: Dictionary = d.get("description", {})
	r.description_en = desc.get("en", "")
	r.description_tp = desc.get("tp", "")
	r.width = d.get("width", 20)
	r.height = d.get("height", 14)
	r.sky_color = d.get("sky_color", "#8bc260")
	r.layers = d.get("layers", [])
	r.tall_grass_keys = d.get("tall_grass_keys", [])
	r.encounters = d.get("encounters", [])

	r.npcs.clear()
	for n in d.get("npcs", []):
		r.npcs.append(NpcResource.from_dict(n))

	r.signs = d.get("signs", [])
	r.warps = d.get("warps", [])

	r.dialog.clear()
	for dn in d.get("dialog", []):
		r.dialog.append(DialogResource.from_dict(dn))

	var sp: Dictionary = d.get("spawn", {"x": 0, "y": 0})
	r.spawn = Vector2i(int(sp.get("x", 0)), int(sp.get("y", 0)))
	return r
