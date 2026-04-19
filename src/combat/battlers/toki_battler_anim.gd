@tool
class_name TokiBattlerAnim
extends BattlerAnim

# Minimal procedural BattlerAnim that displays a sliced frame from the
# Kenney dungeon atlas instead of a bespoke character animation. Built
# at encounter time by CombatArenaBuilder once we know the species.
#
# Trades expressiveness for "works with any species we author" — we can
# upgrade individual species to bespoke anim scenes later without
# changing the combat pipeline.

const DUNGEON_TEX_PATH := "res://overworld/maps/tilesets/dungeon_tilemap.png"

var _sprite: Sprite2D = null
var _anim_player: AnimationPlayer = null


func _ready() -> void:
	super()
	_ensure_children()


# Configure which frame of the Kenney dungeon atlas this battler uses.
# Called by CombatArenaBuilder immediately after instancing.
func set_sprite_frame(frame: int) -> void:
	_ensure_children()
	var tex := load(DUNGEON_TEX_PATH) as Texture2D
	if tex == null:
		push_warning("TokiBattlerAnim: dungeon texture missing")
		return
	_sprite.texture = tex
	_sprite.region_enabled = true
	var col := frame % 12
	var row := frame / 12
	_sprite.region_rect = Rect2(col * 17, row * 17, 16, 16)
	# Scale up so the battler is visible at arena resolution.
	_sprite.scale = Vector2(8, 8)


func _ensure_children() -> void:
	if _sprite != null:
		return
	var pivot := get_node_or_null("Pivot") as Marker2D
	if pivot == null:
		pivot = Marker2D.new()
		pivot.name = "Pivot"
		add_child(pivot)

	_anim_player = pivot.get_node_or_null("AnimationPlayer") as AnimationPlayer
	if _anim_player == null:
		_anim_player = AnimationPlayer.new()
		_anim_player.name = "AnimationPlayer"
		pivot.add_child(_anim_player)
		_install_stub_animation()

	_sprite = pivot.get_node_or_null("Sprite2D") as Sprite2D
	if _sprite == null:
		_sprite = Sprite2D.new()
		_sprite.name = "Sprite2D"
		_sprite.centered = true
		pivot.add_child(_sprite)


# BattlerAnim expects to be able to call play("idle"), play("hurt"), etc.
# Give it a stub "idle" library so nothing throws.
func _install_stub_animation() -> void:
	var library := AnimationLibrary.new()
	var idle := Animation.new()
	idle.length = 0.1
	idle.loop_mode = Animation.LOOP_LINEAR
	library.add_animation("idle", idle)
	# Other expected animation names — empty shells so play() doesn't fail.
	for name in ["hurt", "attack", "die", "action"]:
		var a := Animation.new()
		a.length = 0.1
		library.add_animation(name, a)
	_anim_player.add_animation_library("", library)
	_anim_player.play("idle")
