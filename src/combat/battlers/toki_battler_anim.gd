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

const HURT_DURATION := 0.15
const HURT_SHAKE_PIXELS := 6.0
const HURT_FLASH_COLOR := Color(1.8, 1.8, 1.8, 1.0)

const FAINT_DURATION := 0.5
const FAINT_SLIDE_PIXELS := 40.0

var _sprite: Sprite2D = null
var _anim_player: AnimationPlayer = null
var _hurt_tween: Tween = null
var _faint_tween: Tween = null
var _sprite_rest_position := Vector2.ZERO


func _ready() -> void:
	super()
	_ensure_children()


func setup(battler: Battler, facing: Direction) -> void:
	super(battler, facing)
	battler.hit_received.connect(
		func _on_hit_received(value: int) -> void:
			if value > 0:
				_play_hurt_effect()
	)


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


# Configure this battler to use a creature sprite sheet (assets/creatures/...).
# Displays the first 64×64 cell as a static idle frame. Caller resolves the
# sprite source from the SpeciesResource so different species render distinctly.
func set_sprite_src(path: String) -> void:
	_ensure_children()
	if path == "":
		push_warning("TokiBattlerAnim: empty sprite_src")
		return
	var tex := load(path) as Texture2D
	if tex == null:
		push_warning("TokiBattlerAnim: sprite_src missing: %s" % path)
		return
	_sprite.texture = tex
	_sprite.region_enabled = true
	_sprite.region_rect = Rect2(0, 0, 64, 64)
	_sprite.scale = Vector2(2, 2)


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


# Intercept "hurt" so we can drive a procedural shake+flash on the sprite.
# Everything else defers to the base AnimationPlayer-backed play().
func play(anim_name: String) -> void:
	if anim_name == "hurt":
		_play_hurt_effect()
		return
	if anim_name == "die":
		_play_faint_effect()
		return
	super(anim_name)


func _play_faint_effect() -> void:
	_ensure_children()
	if _sprite == null:
		return
	if _faint_tween != null and _faint_tween.is_valid():
		_faint_tween.kill()
	var start_pos: Vector2 = _sprite_rest_position
	_sprite.position = start_pos
	_sprite.modulate = Color.WHITE
	_faint_tween = create_tween().set_parallel(true)
	_faint_tween.tween_property(_sprite, "position",
		start_pos + Vector2(0, FAINT_SLIDE_PIXELS), FAINT_DURATION
	).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	_faint_tween.tween_property(_sprite, "modulate:a", 0.0, FAINT_DURATION)


func _play_hurt_effect() -> void:
	_ensure_children()
	if _sprite == null:
		return
	if _hurt_tween != null and _hurt_tween.is_valid():
		_hurt_tween.kill()
	_sprite.position = _sprite_rest_position
	_sprite.modulate = HURT_FLASH_COLOR

	var step := HURT_DURATION / 6.0
	_hurt_tween = create_tween()
	_hurt_tween.tween_property(_sprite, "position", _sprite_rest_position + Vector2(HURT_SHAKE_PIXELS, 0), step)
	_hurt_tween.parallel().tween_property(_sprite, "modulate", Color.WHITE, HURT_DURATION)
	_hurt_tween.tween_property(_sprite, "position", _sprite_rest_position + Vector2(-HURT_SHAKE_PIXELS, 0), step)
	_hurt_tween.tween_property(_sprite, "position", _sprite_rest_position + Vector2(HURT_SHAKE_PIXELS * 0.6, 0), step)
	_hurt_tween.tween_property(_sprite, "position", _sprite_rest_position + Vector2(-HURT_SHAKE_PIXELS * 0.6, 0), step)
	_hurt_tween.tween_property(_sprite, "position", _sprite_rest_position + Vector2(HURT_SHAKE_PIXELS * 0.3, 0), step)
	_hurt_tween.tween_property(_sprite, "position", _sprite_rest_position, step)


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
