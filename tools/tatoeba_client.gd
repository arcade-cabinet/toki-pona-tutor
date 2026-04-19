class_name TatoebaClient
extends RefCounted

# Live client for tatoeba.org's tok-eng search API, with a committed
# on-disk cache so CI only hits the network for NEW lines.
#
# Cache shape: Dictionary[String, Array[String]] — normalized EN → array
# of accepted TP strings (can be multiple, Tatoeba often has variants).
# An empty array means "API said no pair exists" (negative cache).
#
# Cache is committed to content/corpus/cache.json. Authors add EN lines,
# run validate_tp, the cache grows, they commit. CI re-runs, cache-hits
# avoid the network entirely.

const CACHE_PATH := "res://content/corpus/cache.json"
const API_ENDPOINT := "https://tatoeba.org/eng/api_v0/search"
const USER_AGENT := "TokiTown/0.1 (github.com/arcade-cabinet/toki-pona-tutor)"

var _cache: Dictionary = {}
var _cache_loaded: bool = false
var _cache_dirty: bool = false
var _offline: bool = false  # when true, never hit the network


func _init(offline: bool = false) -> void:
	_offline = offline
	_load_cache()


# Normalize an EN string for cache keying. Matches the existing Node
# validator's normalization so cache entries survive the port.
static func normalize(s: String) -> String:
	var low := s.to_lower().strip_edges()
	var out := ""
	for c in low:
		match c:
			".", "!", "?", ",", "\"", "'", "\u2018", "\u2019", "\u201c", "\u201d":
				continue
			_:
				out += c
	# Collapse runs of whitespace.
	var parts := out.split(" ", false)
	return " ".join(parts)


func _load_cache() -> void:
	if _cache_loaded:
		return
	_cache_loaded = true
	if not FileAccess.file_exists(CACHE_PATH):
		_cache = {}
		return
	var f := FileAccess.open(CACHE_PATH, FileAccess.READ)
	if f == null:
		_cache = {}
		return
	var text := f.get_as_text()
	f.close()
	var parsed = JSON.parse_string(text)
	if parsed is Dictionary:
		_cache = parsed
	else:
		_cache = {}


func save_cache() -> void:
	if not _cache_dirty:
		return
	# Sort keys so diffs are readable.
	var keys := _cache.keys()
	keys.sort()
	var sorted := {}
	for k in keys:
		sorted[k] = _cache[k]
	var text := JSON.stringify(sorted, "  ")
	var f := FileAccess.open(CACHE_PATH, FileAccess.WRITE)
	if f == null:
		push_error("TatoebaClient: cannot open cache for write at %s" % CACHE_PATH)
		return
	f.store_string(text)
	f.close()
	_cache_dirty = false


# Return Array[String] of accepted TP translations for an EN line, or
# empty array if none exist / offline-and-uncached.
#
# Hits cache first. On miss in online mode, calls the Tatoeba API and
# records the result (positive or negative). In offline mode, returns
# whatever the cache has (empty if uncached).
func lookup(en: String) -> Array:
	var key := normalize(en)
	if _cache.has(key):
		return _cache[key]
	if _offline:
		return []
	var tps := _query_api(key)
	_cache[key] = tps
	_cache_dirty = true
	return tps


func has_any(en: String) -> bool:
	return lookup(en).size() > 0


# Synchronously query the Tatoeba search API for a TP equivalent of the
# given EN string. Returns Array[String].
#
# API docs: https://en.wiki.tatoeba.org/articles/show/api
# Search endpoint: /eng/api_v0/search?from=eng&to=tok&query=...
func _query_api(normalized_en: String) -> Array:
	var http := HTTPClient.new()
	var err := http.connect_to_host("tatoeba.org", 443, TLSOptions.client())
	if err != OK:
		push_warning("TatoebaClient: connect failed: %s" % error_string(err))
		return []

	# Block until connected.
	while http.get_status() == HTTPClient.STATUS_CONNECTING \
			or http.get_status() == HTTPClient.STATUS_RESOLVING:
		http.poll()
		OS.delay_msec(25)

	if http.get_status() != HTTPClient.STATUS_CONNECTED:
		push_warning("TatoebaClient: not connected (status=%d)" % http.get_status())
		return []

	var query := "/eng/api_v0/search?from=eng&to=tok&query=%s" % normalized_en.uri_encode()
	var headers := [
		"User-Agent: " + USER_AGENT,
		"Accept: application/json",
	]
	err = http.request(HTTPClient.METHOD_GET, query, headers)
	if err != OK:
		push_warning("TatoebaClient: request failed: %s" % error_string(err))
		return []

	while http.get_status() == HTTPClient.STATUS_REQUESTING:
		http.poll()
		OS.delay_msec(25)

	if not http.has_response():
		push_warning("TatoebaClient: no response for %s" % normalized_en)
		return []

	var response_code := http.get_response_code()
	if response_code != 200:
		# 400 / 500 from API — treat as "no pair" but don't crash. The
		# cache records the negative so we don't retry a bad query every
		# build.
		return []

	var body := PackedByteArray()
	while http.get_status() == HTTPClient.STATUS_BODY:
		http.poll()
		var chunk := http.read_response_body_chunk()
		if chunk.size() == 0:
			OS.delay_msec(25)
		else:
			body.append_array(chunk)

	http.close()

	var text := body.get_string_from_utf8()
	var parsed = JSON.parse_string(text)
	if not (parsed is Dictionary):
		return []

	return _extract_tp_sentences(parsed, normalized_en)


# Tatoeba returns a search result with a `results` array. Each result has
# a `text` (the EN source sentence, which should match our query) and a
# `translations` array-of-arrays where each inner array contains translation
# entries including a `text` for the TP side.
#
# We match on normalized text equality — Tatoeba fuzzy-matches, so its
# first hit isn't necessarily the one we asked for.
func _extract_tp_sentences(api_response: Dictionary, normalized_query: String) -> Array:
	var results = api_response.get("results", [])
	if not (results is Array):
		return []
	var tps: Array[String] = []
	for entry in results:
		if not (entry is Dictionary):
			continue
		var en_text := String(entry.get("text", ""))
		if normalize(en_text) != normalized_query:
			continue
		var translations = entry.get("translations", [])
		if not (translations is Array):
			continue
		for group in translations:
			if not (group is Array):
				continue
			for t in group:
				if not (t is Dictionary):
					continue
				if String(t.get("lang", "")) != "tok":
					continue
				var tp := String(t.get("text", "")).strip_edges()
				if tp.length() > 0 and not tp in tps:
					tps.append(tp)
	return tps
