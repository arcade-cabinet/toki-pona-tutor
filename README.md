# poki soweli

A Pokemon-shape 2D RPG whose language is **toki pona** — not as the mechanic, but as the diegetic flavor of the world. Every multi-word English line the game ships with has a canonical toki pona pair, validated live against the Tatoeba corpus; no hand-authored translations.

Built in **Godot 4.6** (GDScript). Android + web + desktop. Arcade-cabinet aesthetic.

## Origins

This repo started as a web prototype (Vite + React + SolidJS + Phaser 4 + Koota). It was reborn as a Godot native project on 2026-04-19 — see [`docs/ENGINE_DECISION.md`](docs/ENGINE_DECISION.md) for the why. The authored content (7 regions, 17 species, 17 moves, 4 items) carried over intact; the engine under it was replaced.

Two reference projects shaped the pivot:
- **`/Users/jbogaty/src/arcade-cabinet/ashworth-manor/`** — our Godot testing + CI/CD + mobile-export skeleton
- **[gdquest-demos/godot-open-rpg](https://github.com/gdquest-demos/godot-open-rpg)** — MIT-licensed 2D RPG base (overworld, turn-based combat, dialogue). Already uses Kenney Tiny Town, our chosen tileset.

## Status

Active development. See [`docs/STATE.md`](docs/STATE.md) for where we are.

## Docs

- [`docs/ENGINE_DECISION.md`](docs/ENGINE_DECISION.md) — the Godot pivot ADR (accepted)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture
- [`docs/WRITING_RULES.md`](docs/WRITING_RULES.md) — rules for authoring any in-game English that must round-trip through toki pona
- [`docs/AGENT_TEAMS.md`](docs/AGENT_TEAMS.md) — parallel agent authoring via git worktrees
- [`docs/agent-briefs/`](docs/agent-briefs/) — per-role agent briefs (region team, species team)

## License

[MIT](LICENSE). Incorporates the MIT-licensed Godot 4 Open RPG demo by GDQuest — see [`CREDITS.md`](CREDITS.md).
