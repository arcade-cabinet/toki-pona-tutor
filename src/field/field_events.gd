## A signal bus to connect distant scenes to various field-exclusive events.
extends Node

## Set this object's process priority to a very high number.
## We want the Field Event manager's _process method to run after all Gamepieces and Controllers.
const PROCESS_PRIORITY: = 99999999

## Emitted when the cursor moves to a new position on the field gameboard.
@warning_ignore("unused_signal")
signal cell_highlighted(cell: Vector2i)

## Emitted when the player selects a cell on the field gameboard via the [FieldCursor].
@warning_ignore("unused_signal")
signal cell_selected(cell: Vector2i)

## Emitted when the player selects a cell that is covered by an [Interaction].
@warning_ignore("unused_signal")
signal interaction_selected(interaction: Interaction)

### Emitted when the player moves over a cell containing a [Trigger].
#@warning_ignore("unused_signal")
#signal interaction_selected(interaction: Interaction)

## Emitted whenever a combat is triggered. This will lead to a transition from the field 'state' to
## a combat 'state'.
@warning_ignore("unused_signal")
signal combat_triggered(arena: PackedScene)

## Emitted when a [Cutscene] begins, signalling that the player should yield control of their
## character to the cutscene code.
@warning_ignore("unused_signal")
signal cutscene_began

## Emitted when a [Cutscene] ends, restoring normal mode of play.
@warning_ignore("unused_signal")
signal cutscene_ended

## Emitted whenever ALL input within the field state is to be paused or resumed.
## Typically emitted by combat, dialogues, etc.
@warning_ignore("unused_signal")
signal input_paused(is_paused: bool)

# --- Toki Town dialog / interaction events ---

## Request the DialogOverlay to play a dialog node. Fired by
## NpcInteraction after RegionBuilder has selected the right node for
## current save state.
@warning_ignore("unused_signal")
signal dialog_requested(node: DialogResource)

## Emitted when the player enters / leaves interaction range of an NPC,
## so a HUD can show/hide an "[E] Talk" prompt.
@warning_ignore("unused_signal")
signal interaction_range_entered(npc_id: String)
@warning_ignore("unused_signal")
signal interaction_range_exited(npc_id: String)

## Emitted when a dialog node fires a trigger on close. Separate signals
## per trigger kind so each system can subscribe to only what it cares
## about (save system, inventory, party manager, quest tracker).
@warning_ignore("unused_signal")
signal flag_set(flag: String, value: bool)
@warning_ignore("unused_signal")
signal item_given(item_id: String, count: int)
@warning_ignore("unused_signal")
signal party_add(species_id: String, level: int)
@warning_ignore("unused_signal")
signal quest_advanced(quest_id: String, stage: String)
