class_name Palette
extends RefCounted

# Toki Town color tokens. Single source of truth. See theme/BRAND.md for
# meanings and usage guidance.
#
# Import: const Palette = preload("res://theme/palette.gd")
# Use:    ColorRect.color = Palette.EMERALD

# --- Warm neutrals (foundation) ---
const CREAM := Color("#FDF6E3")
const PARCHMENT := Color("#F5E6C5")
const PARCHMENT_DEEP := Color("#E8D5A8")
const WARM_BORDER := Color("#C8A96B")
const INK := Color("#3D2E1E")
const INK_SOFT := Color("#6B5940")

# --- Brand accents ---
const EMERALD := Color("#4A9D5A")
const EMERALD_DEEP := Color("#327144")
const AMBER := Color("#E8A04A")
const AMBER_DEEP := Color("#C87A26")
const PEACH := Color("#F4B995")

# --- Elemental type colors (seli/telo/kasi/lete/wawa) ---
const TYPE_SELI := Color("#E8553E")  # fire
const TYPE_TELO := Color("#4DA3D4")  # water
const TYPE_KASI := Color("#6FB35C")  # plant
const TYPE_LETE := Color("#B8D4DC")  # cold
const TYPE_WAWA := Color("#D4A84E")  # lightning/strong

# --- Status ---
const JOY := Color("#F2C158")
const CAUTION := Color("#D98A3F")
const DANGER := Color("#C85A4A")

# --- Sky tints (match region biomes) ---
const SKY_DAY := Color("#A8D8E8")
const SKY_PEAK := Color("#6B7A83")
const SKY_COLD := Color("#C4D8E8")


# Map a type identifier to its accent color.
static func for_type(type_id: String) -> Color:
	match type_id:
		"seli": return TYPE_SELI
		"telo": return TYPE_TELO
		"kasi": return TYPE_KASI
		"lete": return TYPE_LETE
		"wawa": return TYPE_WAWA
		_: return INK_SOFT
