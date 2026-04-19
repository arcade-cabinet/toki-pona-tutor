class_name DialogResource
extends Resource

# A dialog node — one multi-beat conversation an NPC can deliver,
# optionally gated by quest stage / flag state, optionally firing
# side-effects (set flag, give item, add_party creature, etc) when closed.
#
# Pull-style: the engine asks "what should this NPC say right now?"
# and picks the first node whose when_quest + when_flags are satisfied,
# highest priority wins.

@export var id: String = ""
@export var npc_id: String = ""  # empty string = region-narration (no NPC)

# when_quest: {quest_id: required_stage}
@export var when_quest: Dictionary = {}
# when_flags: {flag_name: required_bool}
@export var when_flags: Dictionary = {}
@export var priority: int = 0

# beats: Array of dicts {text: Translatable-ish, mood, glyph}
@export var beats: Array = []

# Triggers that fire on dialog close.
@export_group("Triggers")
@export var trigger_set_flags: Dictionary = {}  # {flag: bool}
@export var trigger_advance_quest_id: String = ""
@export var trigger_advance_quest_stage: String = ""
@export var trigger_give_item_id: String = ""
@export var trigger_give_item_count: int = 0
@export var trigger_add_party_species: String = ""
@export var trigger_add_party_level: int = 0

# Optional branching choices presented after beats complete. When
# non-empty, the overlay shows lettered options (A/B/C…). Dialog-level
# triggers (trigger_set_flags, trigger_give_item_id, etc.) ALWAYS fire
# on close; the selected choice's triggers fire IN ADDITION to — not
# instead of — the dialog-level ones. Author choice triggers for what
# only the picked branch should do, and dialog-level triggers for
# effects common to every branch.
# Each entry is a Dictionary: {label: {tp,en}, glyph, triggers: {...}}
@export var choices: Array = []


static func from_dict(d: Dictionary) -> DialogResource:
	var r := DialogResource.new()
	r.id = String(d.get("id", ""))
	r.npc_id = String(d.get("npc_id", "")) if d.get("npc_id") != null else ""
	r.when_quest = d.get("when_quest", {}) if d.get("when_quest") is Dictionary else {}
	r.when_flags = d.get("when_flags", {}) if d.get("when_flags") is Dictionary else {}
	r.priority = int(d.get("priority", 0))
	r.beats = d.get("beats", []) if d.get("beats") is Array else []
	r.choices = d.get("choices", []) if d.get("choices") is Array else []

	var triggers_raw: Variant = d.get("triggers", {})
	var triggers: Dictionary = triggers_raw if triggers_raw is Dictionary else {}
	r.trigger_set_flags = triggers.get("set_flag", {}) if triggers.get("set_flag") is Dictionary else {}
	var adv: Dictionary = triggers.get("advance_quest", {}) if triggers.get("advance_quest") is Dictionary else {}
	r.trigger_advance_quest_id = String(adv.get("quest_id", ""))
	r.trigger_advance_quest_stage = String(adv.get("stage", ""))
	var gi: Dictionary = triggers.get("give_item", {}) if triggers.get("give_item") is Dictionary else {}
	r.trigger_give_item_id = String(gi.get("item_id", ""))
	r.trigger_give_item_count = int(gi.get("count", 0))
	var ap: Dictionary = triggers.get("add_party", {}) if triggers.get("add_party") is Dictionary else {}
	r.trigger_add_party_species = String(ap.get("species_id", ""))
	r.trigger_add_party_level = int(ap.get("level", 0))
	return r
