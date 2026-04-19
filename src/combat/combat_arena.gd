## An arena is the editor-configured environment for a battle. It is a Control node that contains 
## the combat participants and details (such as background, foreground, music, etc.).
class_name CombatArena extends Control

## The music that will be automatically played during this combat instance.
@export var music: AudioStream

## XP yield granted to the party lead on victory. Set by the arena
## builder so Combat.gd can drive the end-of-battle victory panel
## without reaching back into the spawner.
@export var xp_yield: int = 0

## Whether the player may attempt to flee this arena. Set true by wild
## encounter builders; rival/set-piece arenas leave it false.
@export var allow_flee: bool = false

## Species id of the primary enemy — used by combat.gd to track bestiary
## (US-056), roll item drops + coin reward (US-027 / US-059) on victory.
## Empty for multi-enemy set-pieces that don't have one canonical species.
@export var enemy_species_id: String = ""

## Optional badge awarded on player victory (US-052). Used by jan-lawa
## arenas to add to TokiSave.badges and surface the ceremony dialog.
@export var badge_award: String = ""


## Retrieve the list of the combat participants, in [BattlerRoster] form.
func get_battler_roster() -> BattlerRoster:
	return $Battlers as BattlerRoster
