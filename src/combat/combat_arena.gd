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


## Retrieve the list of the combat participants, in [BattlerRoster] form.
func get_battler_roster() -> BattlerRoster:
	return $Battlers as BattlerRoster
