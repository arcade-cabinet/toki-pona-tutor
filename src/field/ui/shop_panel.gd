class_name ShopPanel
extends CanvasLayer

# Minimal shop UI. Reads a static inventory from the `stock` array
# (each entry {item_id, price}) and lets the player buy items with
# `ma` coins (TokiSave.coins()). Opened by NpcInteraction when the
# interacted NPC.role == "shopkeeper".

signal closed

@onready var _stock_list: VBoxContainer = $Root/Margin/Panel/V/Stock
@onready var _coins_label: Label = $Root/Margin/Panel/V/Header/Coins
@onready var _close_btn: Button = $Root/Margin/Panel/V/Close

var _stock: Array = []
var _paused_by_us: bool = false


func _ready() -> void:
	visible = false
	process_mode = Node.PROCESS_MODE_ALWAYS
	_close_btn.pressed.connect(close)


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		close()


func open(stock: Array) -> void:
	_stock = stock
	_rebuild()
	visible = true
	if not get_tree().paused:
		get_tree().paused = true
		_paused_by_us = true
	_close_btn.grab_focus()


func close() -> void:
	visible = false
	if _paused_by_us:
		get_tree().paused = false
		_paused_by_us = false
	closed.emit()


func _rebuild() -> void:
	for child in _stock_list.get_children():
		child.queue_free()
	_refresh_coins()
	for entry in _stock:
		if not (entry is Dictionary): continue
		var item_id := String(entry.get("item_id", ""))
		var price := int(entry.get("price", 0))
		if item_id == "": continue
		var row := HBoxContainer.new()
		var name_l := Label.new()
		name_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		name_l.text = item_id
		row.add_child(name_l)
		var price_l := Label.new()
		price_l.theme_type_variation = &"mono"
		price_l.custom_minimum_size = Vector2(80, 0)
		price_l.text = "%d ma" % price
		row.add_child(price_l)
		var buy := Button.new()
		buy.custom_minimum_size = Vector2(80, 44)
		buy.text = "Buy"
		buy.pressed.connect(_on_buy.bind(item_id, price))
		row.add_child(buy)
		_stock_list.add_child(row)


func _refresh_coins() -> void:
	var coins := TokiSave.coins() if TokiSave else 0
	_coins_label.text = "%d ma" % coins


func _on_buy(item_id: String, price: int) -> void:
	if TokiSave == null: return
	if TokiSave.coins() < price: return
	TokiSave.give_coins(-price)
	TokiSave.give_item(item_id, 1)
	_refresh_coins()
