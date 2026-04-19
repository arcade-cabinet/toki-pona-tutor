extends Node2D

# Lean map node for Toki Town. Instead of wiring GameboardProperties in
# the editor (like open-rpg's map.gd), we rely on the RegionBuilder
# child to configure Gameboard + Camera at runtime from a RegionResource.
#
# Keeps map scenes declarative: drop a RegionBuilder, set its region_id,
# done.


func _ready() -> void:
	# Camera + Gameboard wiring happens in RegionBuilder._configure_gameboard().
	pass


# Called by RegionBuilder once gameboard_properties are known.
var gameboard_properties: GameboardProperties = null:
	set(value):
		gameboard_properties = value
		if not is_inside_tree():
			await ready
		if gameboard_properties == null:
			return
		if Gameboard:
			Gameboard.properties = gameboard_properties
		if Camera:
			Camera.gameboard_properties = gameboard_properties
