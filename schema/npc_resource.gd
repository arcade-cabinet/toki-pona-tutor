class_name NpcResource
extends Resource

# An NPC placed in a region. Their dialog beats live on the region's
# dialog[] array, keyed by this NPC's id.

const VALID_ROLES: Array[String] = [
	"starter_giver", "jan_lawa", "quest_giver", "ambient", "shopkeeper", "rival",
]

@export var id: String = ""
@export var name_tp: String = ""
@export var name_en: String = ""
@export var role: String = "ambient"
@export var personality: String = ""

@export_group("Placement")
@export var tile: Vector2i = Vector2i.ZERO
@export var sprite_frame: int = 0
@export var portrait_src: String = ""

@export_group("Greeting")
@export var greeting_text_en: String = ""
@export var greeting_text_tp: String = ""
@export var greeting_mood: String = "thinking"

@export_group("Team (jan_lawa only)")
# Array of dicts {species_id, level, moves}
@export var team: Array = []
@export var reward_word: String = ""


static func from_dict(d: Dictionary) -> NpcResource:
	var r := NpcResource.new()
	r.id = d.get("id", "")
	r.name_tp = d.get("name_tp", "")
	r.name_en = d.get("name_en", "")
	r.role = d.get("role", "ambient")
	r.personality = d.get("personality", "")
	var t: Dictionary = d.get("tile", {"x": 0, "y": 0})
	r.tile = Vector2i(int(t.get("x", 0)), int(t.get("y", 0)))
	r.sprite_frame = d.get("sprite_frame", 0)
	r.portrait_src = d.get("portrait_src", "")
	var g: Dictionary = d.get("greeting", {})
	var g_text: Dictionary = g.get("text", {})
	r.greeting_text_en = g_text.get("en", "")
	r.greeting_text_tp = g_text.get("tp", "")
	r.greeting_mood = g.get("mood", "thinking")
	r.team = d.get("team", [])
	r.reward_word = d.get("reward_word", "")
	return r
