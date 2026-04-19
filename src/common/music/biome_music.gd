class_name BiomeMusic
extends Node

# Routes region biomes → AudioStream tracks. Reads RegionResource.biome
# off the current region (via RegionBuilder.region_changed), cross-fades
# via the Music autoload's play(time_out, time_in) fade.
#
# US-060: 7 biome names mapped across 4 available tracks. The Music
# autoload is created from music_player.tscn and manages one stream.
#
# Combat overrides are NOT done here — Combat.setup() already calls
# Music.play(combat_arena.music) directly, stashing the previous track
# in _previous_music_track so combat end can restore it.

const FADE_IN := 0.8
const FADE_OUT := 0.8

# Map biome id → track path. "default" catches anything unmapped.
# Pairs are chosen so town/forest/water feel warm (Apple Cider, Insect
# Factory) and cold/peak/cave/ice lean more intense (the_fun_run,
# squashin_bugs_fixed).
const BIOME_TRACKS: Dictionary = {
	"town": "res://assets/music/Apple Cider.mp3",
	"forest": "res://assets/music/Apple Cider.mp3",
	"water": "res://assets/music/Insect Factory.mp3",
	"peak": "res://assets/music/the_fun_run.mp3",
	"cave": "res://assets/music/squashin_bugs_fixed.mp3",
	"ice": "res://assets/music/squashin_bugs_fixed.mp3",
	"dungeon": "res://assets/music/squashin_bugs_fixed.mp3",
	"default": "res://assets/music/Apple Cider.mp3",
}


func _ready() -> void:
	# Hook into region transitions via the FieldEvents bus. Regions
	# publish region_changed on RegionBuilder._ready() load, which is
	# the right moment to cross-fade.
	if FieldEvents != null and FieldEvents.has_signal("region_changed"):
		FieldEvents.region_changed.connect(_on_region_changed)


func _on_region_changed(region: RegionResource) -> void:
	if region == null: return
	var biome: String = region.biome if "biome" in region else ""
	var track_path: String = BIOME_TRACKS.get(biome, BIOME_TRACKS["default"])
	if not ResourceLoader.exists(track_path):
		push_warning("[BiomeMusic] track missing: %s" % track_path)
		return
	var stream: AudioStream = load(track_path)
	if stream == null or Music == null: return
	Music.play(stream, FADE_IN, FADE_OUT)
