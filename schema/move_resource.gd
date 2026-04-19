class_name MoveResource
extends Resource

# A combat move. Attached to species via their learnset.

const VALID_EFFECTS: Array[String] = [
	"none", "flinch", "heal_self_25", "raise_attack", "lower_defense", "poison",
]

@export var id: String = ""
@export var name_tp: String = ""
@export var name_en: String = ""
@export var description_en: String = ""
@export var description_tp: String = ""
@export var type: String = "wawa"
@export var power: int = 0
@export var accuracy: int = 100
@export var pp: int = 15
@export var effect: String = "none"
@export var priority: int = 0


static func from_dict(d: Dictionary) -> MoveResource:
	var r := MoveResource.new()
	r.id = d.get("id", "")
	var name_dict: Dictionary = d.get("name", {})
	r.name_tp = name_dict.get("tp", name_dict.get("en", ""))
	r.name_en = name_dict.get("en", "")
	var desc_dict: Dictionary = d.get("description", {})
	r.description_en = desc_dict.get("en", "")
	r.description_tp = desc_dict.get("tp", "")
	r.type = d.get("type", "wawa")
	r.power = d.get("power", 0)
	r.accuracy = d.get("accuracy", 100)
	r.pp = d.get("pp", 15)
	r.effect = d.get("effect", "none")
	r.priority = d.get("priority", 0)
	return r
