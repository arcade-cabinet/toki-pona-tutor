class_name SpeciesResource
extends Resource

# A creature species. Authored as JSON in content/spine/species/<id>.json;
# emitted as .tres by tools/build_spine.gd.

@export var id: String = ""
@export var name_tp: String = ""  # from name.en — single dictionary word
@export var name_en: String = ""
@export var description_en: String = ""
@export var description_tp: String = ""
@export var type: String = "wawa"  # one of TokiTypes.ALL

# Base stats — level-1 creature. Combat engine scales by level.
@export_group("Base Stats")
@export var hp: int = 40
@export var attack: int = 40
@export var defense: int = 40
@export var speed: int = 40

# Learnset: Array of dicts {level: int, move_id: String}
@export var learnset: Array = []

@export var catch_rate: float = 0.25
@export var xp_yield: int = 30
# Optional victory reward: item_drop_id at item_drop_chance (0.0..1.0).
# US-027 — rolls once per defeated wild + awarded to TokiSave.inventory.
@export var item_drop_id: String = ""
@export var item_drop_chance: float = 0.0
# Money reward in ma (coins). US-059 — always awarded on victory.
@export var coin_yield: int = 0
@export var sprite_frame: int = 0
@export var sprite_src: String = ""  # res:// path to battler sprite sheet; first 64×64 cell used as idle
@export var portrait_src: String = ""


static func from_dict(d: Dictionary) -> SpeciesResource:
	var r := SpeciesResource.new()
	r.id = d.get("id", "")
	var name_dict: Dictionary = d.get("name", {})
	r.name_tp = name_dict.get("tp", name_dict.get("en", ""))
	r.name_en = name_dict.get("en", "")
	var desc_dict: Dictionary = d.get("description", {})
	r.description_en = desc_dict.get("en", "")
	r.description_tp = desc_dict.get("tp", "")
	r.type = d.get("type", "wawa")
	var stats: Dictionary = d.get("base_stats", {})
	r.hp = stats.get("hp", 40)
	r.attack = stats.get("attack", 40)
	r.defense = stats.get("defense", 40)
	r.speed = stats.get("speed", 40)
	r.learnset = d.get("learnset", [])
	r.catch_rate = d.get("catch_rate", 0.25)
	r.xp_yield = d.get("xp_yield", 30)
	var drop: Dictionary = d.get("item_drop", {}) if d.get("item_drop") is Dictionary else {}
	r.item_drop_id = String(drop.get("item_id", ""))
	r.item_drop_chance = float(drop.get("chance", 0.0))
	r.coin_yield = int(d.get("coin_yield", 0))
	r.sprite_frame = d.get("sprite_frame", 0)
	r.sprite_src = d.get("sprite_src", "")
	r.portrait_src = d.get("portrait_src", "")
	return r
