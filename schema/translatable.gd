class_name Translatable
extends Resource

# A translatable string — authored English + canonical toki pona.
#
# Authors write `{ en: "..." }` in spine JSON. The build step resolves
# `tp` from the live Tatoeba API (cached). Both fields are present after
# build; only `en` is guaranteed before.
#
# Single-word English is exempt from Tatoeba lookup (see also
# TranslatableWord) — the dictionary is pre-vetted.

@export var en: String = ""
@export var tp: String = ""


func _init(p_en: String = "", p_tp: String = "") -> void:
	en = p_en
	tp = p_tp


# Is this a single-word translatable (exempt from Tatoeba validation)?
func is_single_word() -> bool:
	return en.length() > 0 and not " " in en.strip_edges()


static func from_dict(d: Dictionary) -> Translatable:
	return Translatable.new(d.get("en", ""), d.get("tp", ""))
