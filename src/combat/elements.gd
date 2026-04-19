class_name Elements extends RefCounted

# Elemental types. Open-rpg shipped with {NONE, BUG, BREAK, SEEK}; we add
# Toki Town's five types (SELI/TELO/KASI/LETE/WAWA) alongside so both
# demos + our content can coexist during the pivot.
#
# Matchups follow our schema/types.gd TYPE_CHART:
#   seli > kasi, weak vs telo, resists self
#   telo > seli, weak vs kasi, resists self
#   kasi > telo, weak vs seli, resists self
#   lete > kasi, weak vs seli, resists self
#   wawa: neutral to everything (physical)

enum Types {
	NONE,
	# open-rpg legacy (placeholder battlers + example arenas reference these)
	BUG, BREAK, SEEK,
	# toki town — authored content uses these
	SELI, TELO, KASI, LETE, WAWA,
}

## Advantages map: keys are attacker types, values are the list of
## defender types they deal extra damage to.
const ADVANTAGES: = {
	Types.NONE: [],
	# Legacy open-rpg wheel — kept so sample arenas still function.
	Types.BUG: [Types.BREAK],
	Types.BREAK: [Types.NONE, Types.SEEK],
	Types.SEEK: [Types.BUG],
	# Toki Town wheel.
	Types.SELI: [Types.KASI],
	Types.TELO: [Types.SELI],
	Types.KASI: [Types.TELO],
	Types.LETE: [Types.KASI],
	Types.WAWA: [],  # physical — no super-effective targets
}

## Defender types the attacker is weak against (for resistance).
const RESISTANCES: = {
	Types.SELI: [Types.TELO, Types.SELI],
	Types.TELO: [Types.KASI, Types.TELO],
	Types.KASI: [Types.SELI, Types.KASI],
	Types.LETE: [Types.SELI, Types.LETE],
}

## Multiplier attacker-type deals to defender-type. 2.0 super, 1.0 neutral,
## 0.5 resisted. Used by BattlerAction when resolving hits.
static func multiplier(attacker: Types, defender: Types) -> float:
	var advantages: Array = ADVANTAGES.get(attacker, [])
	if defender in advantages: return 2.0
	var resisted: Array = RESISTANCES.get(attacker, [])
	if defender in resisted: return 0.5
	return 1.0


## Map a Toki Town type-id string ("seli", "telo", ...) to the Elements.Types
## enum value. Case-insensitive. Returns Types.NONE for unknown.
static func from_string(type_id: String) -> Types:
	match type_id.to_lower():
		"seli": return Types.SELI
		"telo": return Types.TELO
		"kasi": return Types.KASI
		"lete": return Types.LETE
		"wawa": return Types.WAWA
		"bug": return Types.BUG
		"break": return Types.BREAK
		"seek": return Types.SEEK
		_: return Types.NONE
