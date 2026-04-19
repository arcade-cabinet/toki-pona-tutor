class_name TokiTypes
extends RefCounted

# Elemental types creatures and moves belong to. Five at vertical slice,
# expandable. Matchup table lives in TYPE_CHART — a new type is added by
# extending the enum string list and the chart.

const ALL: Array[String] = ["seli", "telo", "kasi", "lete", "wawa"]

# Effectiveness multiplier for an attacker-type vs defender-type.
# 2 = super effective, 0.5 = not very, 1 = neutral (default), 0 = immune.
# Single-type per creature in v1.
const TYPE_CHART: Dictionary = {
	"seli": {"kasi": 2.0, "telo": 0.5, "seli": 0.5},
	"telo": {"seli": 2.0, "kasi": 0.5, "telo": 0.5},
	"kasi": {"telo": 2.0, "seli": 0.5, "kasi": 0.5},
	"lete": {"kasi": 2.0, "seli": 0.5, "lete": 0.5},
	"wawa": {},
}


static func multiplier(attacker: String, defender: String) -> float:
	var chart: Dictionary = TYPE_CHART.get(attacker, {})
	return chart.get(defender, 1.0)


static func is_valid(type_id: String) -> bool:
	return type_id in ALL
