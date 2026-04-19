class_name ItemResource
extends Resource

# An inventory item. Poki (nets), heal items, key items, flavor.

const VALID_KINDS: Array[String] = ["poki", "heal", "key", "flavor"]

@export var id: String = ""
@export var name_tp: String = ""
@export var name_en: String = ""
@export var description_en: String = ""
@export var description_tp: String = ""
@export var kind: String = "flavor"
@export var power: float = 0.0
@export var stackable: bool = true
@export var sprite_frame: int = 0


static func from_dict(d: Dictionary) -> ItemResource:
	var r := ItemResource.new()
	r.id = d.get("id", "")
	var name_dict: Dictionary = d.get("name", {})
	r.name_tp = name_dict.get("tp", name_dict.get("en", ""))
	r.name_en = name_dict.get("en", "")
	var desc_dict: Dictionary = d.get("description", {})
	r.description_en = desc_dict.get("en", "")
	r.description_tp = desc_dict.get("tp", "")
	r.kind = d.get("kind", "flavor")
	r.power = d.get("power", 0.0)
	r.stackable = d.get("stackable", true)
	r.sprite_frame = d.get("sprite_frame", 0)
	return r
