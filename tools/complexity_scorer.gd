class_name ComplexityScorer
extends RefCounted

# Scores an EN line against poki soweli's writing rules. Returns a rank 0–100
# and a list of reasons. Build fails on rank > CEILING for non-legacy files.
#
# See docs/WRITING_RULES.md for the full spec. Ported 1:1 from the Node
# validate-tp scorer so results match what authors already see in CI.

const CEILING: int = 40
const VOCAB_PATH := "res://content/corpus/en-top2000.json"

const FUNCTION_WORDS: Array[String] = [
	"the", "a", "an", "is", "are", "was", "were", "be", "been", "to", "of",
	"in", "on", "at", "and", "or", "but", "not", "no", "do", "does", "did",
	"have", "has", "had", "my", "your", "his", "her", "their", "our", "its",
	"it", "he", "she", "they", "we", "you", "i", "me", "him", "them", "us",
	"this", "that", "these", "those", "for", "from", "with",
	"i'm", "don't", "you're", "it's", "that's", "can't", "i've",
]

const GOOD_STARTERS: Array[String] = [
	"i", "you", "he", "she", "we", "they", "tom", "the", "this", "that",
	"it", "do", "does", "did", "is", "are", "was", "were",
	"what", "why", "how", "where", "when", "who",
	"i'm", "you're", "it's", "don't",
]

var _vocab_rank: Dictionary = {}  # word → rank (0 = most common)
var _loaded: bool = false


func _init() -> void:
	_load_vocab()


func _load_vocab() -> void:
	if _loaded:
		return
	_loaded = true
	if not FileAccess.file_exists(VOCAB_PATH):
		push_warning("ComplexityScorer: en-top2000.json missing; vocab scoring disabled")
		return
	var f := FileAccess.open(VOCAB_PATH, FileAccess.READ)
	if f == null:
		return
	var parsed = JSON.parse_string(f.get_as_text())
	f.close()
	if parsed is Array:
		for i in parsed.size():
			var word = parsed[i]
			if word is String:
				_vocab_rank[word] = i


class Score:
	var rank: int = 0
	var reasons: Array[String] = []
	func passes() -> bool: return rank <= CEILING


func score(en: String) -> Score:
	var s := Score.new()
	var trimmed := en.strip_edges()

	# Tokenize.
	var lower := trimmed.to_lower()
	var stripped := ""
	for c in lower:
		match c:
			".", "!", "?", ",", "\"", "'", "\u2018", "\u2019", "\u201c", "\u201d":
				continue
			_:
				stripped += c
	var words: Array = stripped.split(" ", false)
	var n := words.size()

	# S1 — Vocabulary tier (weight 35%).
	var vocab_score := 0.0
	var content: Array[String] = []
	for w in words:
		if not (w in FUNCTION_WORDS):
			content.append(w)
	if content.size() > 0 and _vocab_rank.size() > 0:
		var sum := 0.0
		var worst: Array[String] = []
		for w in content:
			var r = _vocab_rank.get(w, -1)
			var ws: float
			if r == -1:
				ws = 100.0
				if not (w in worst): worst.append(w)
			elif r < 250:
				ws = 0.0
			elif r < 1000:
				ws = 15.0
			else:
				ws = 50.0
				if not (w in worst): worst.append(w)
			sum += ws
		vocab_score = sum / content.size()
		if worst.size() > 0:
			var sample := worst.slice(0, 4)
			s.reasons.append("rare words: " + ", ".join(sample))

	# S2 — Starter shape (weight 25%).
	var starter_score := 0.0
	var starter: String = String(words[0]) if words.size() > 0 else ""
	if starter.ends_with("ing") and starter.length() > 3:
		starter_score = 70.0
		s.reasons.append("gerund starter \"%s\"" % starter)
	elif not (starter in GOOD_STARTERS):
		starter_score = 50.0
		s.reasons.append("uncommon starter \"%s\"" % starter)

	# S3 — Clause count (weight 20%).
	var clause_score := 0.0
	var lc := trimmed.to_lower()
	if _has_word(lc, ["because", "although", "while", "which", "whom", "whose"]):
		clause_score = 70.0
		s.reasons.append("subordinate clause")
	elif _has_word(lc, ["and", "but", "or"]):
		clause_score = 40.0
		s.reasons.append("compound clause")
	elif "," in trimmed:
		clause_score = 30.0
		s.reasons.append("comma (likely multi-clause)")

	# S4 — Length fit (weight 15%).
	var len_score := 0.0
	if n >= 10:
		len_score = 100.0
		s.reasons.append("length %d words (p99=18, target ≤ 9)" % n)
	elif n >= 7:
		len_score = 25.0

	# S5 — Exotic punctuation (weight 5%).
	var punct_score := 0.0
	var exotic := ["\u2026", "\u2014", ";", ":", "/", "(", ")", "\u201c", "\u201d"]
	for p in exotic:
		if p in trimmed:
			punct_score = 100.0
			s.reasons.append("exotic punctuation (…—;:/())")
			break

	s.rank = int(round(
		vocab_score * 0.35
		+ starter_score * 0.25
		+ clause_score * 0.20
		+ len_score * 0.15
		+ punct_score * 0.05
	))
	return s


static func _has_word(haystack: String, words: Array) -> bool:
	for w in words:
		# Word-boundary check: space on both sides, or at start / end.
		if haystack == w: return true
		if haystack.begins_with(w + " "): return true
		if haystack.ends_with(" " + w): return true
		if (" " + w + " ") in haystack: return true
	return false
