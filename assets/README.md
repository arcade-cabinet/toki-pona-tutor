# Toki Town assets

Art, audio, and data used by the game. Organized by domain so region
authors know where to look.

## Layout

```
assets/
├── characters/
│   ├── adventurers/    — 57 warrior/rogue/mage sprites (party + NPCs)
│   ├── knight/         — 4 heavy-knight animations (boss NPC)
│   └── town_folk/      — 40 citizen/guard/warrior sprites (village NPCs)
├── creatures/
│   ├── dragons/        — 12 dragon sprites + death animations (boss-tier encounters)
│   └── monsters/       — 19 creature-extended sprites (regular wild encounters)
├── editor/             — editor-only icons (open-rpg legacy)
├── gui/
│   ├── combat/         — battle UI atlas (open-rpg)
│   ├── emotes/         — NPC mood bubbles
│   ├── font/
│   │   └── google/     — Nunito (body), Fredoka (display), JetBrains Mono (numbers),
│   │                     nasin-nanpa (sitelen-pona glyphs)
│   └── icons/          — action buttons, cursor, etc
├── items/              — inventory icons (open-rpg legacy atlases)
├── music/              — background music (Zane Little Music, CC0)
├── sfx/                — combat + UI sfx (Kenney Impact Sounds, CC0)
└── tilesets/
    ├── cave/           — 12 natural-interior cave tiles
    ├── dungeon_16/     — 16 classic dungeon tiles (stone, traps, doors)
    ├── forest_summer/  — 9 PICO-8 palette forest tiles
    ├── forest_winter/  — 6 PICO-8 palette winter tiles (ma_lete / nena_suli)
    ├── old_town/       — 29 village buildings (exterior + interior)
    └── world_map/      — 8 strategic-view tiles
```

Open-rpg inherited tilesets (`overworld/maps/tilesets/kenney_terrain.tres`
pointing at `overworld/maps/tilesets/town_tilemap.png` + `dungeon_tilemap.png`)
remain in-tree as the current default for `res://content/tile_keys.gd`
until regions are migrated to the richer biome-specific tilesets above.

## Credits

See `CREDITS.md` at the repo root.
