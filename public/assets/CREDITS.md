# Asset Credits

Assets in `public/assets/` grouped by in-game role. Per-pack documentation lives in `docs/tilesets/`.

## Tilesets (fan-tasy family, 6 biome variants)

`public/assets/tilesets/{core,seasons,snow,desert,fortress,indoor}/` — "The Fan-tasy Tileset" by biome expansion. Each pack preserves its `Art/` + `Tiled/` layout so `.tmx` and `.tsx` relative paths resolve unchanged.

| Dir | Role |
|---|---|
| core | Default overworld library — grass, water, roads, buildings, trees, rocks |
| seasons | Seasonal recolors of core |
| snow | Deep-winter overworld |
| desert | Desert biome overworld |
| fortress | Fortified buildings, stone walls |
| indoor | Interior-only: floors, walls, furniture |

## Characters

| Dir | Source | Role |
|---|---|---|
| player | Fan-tasy Main Character | Player protagonist (idle/walk/slash) |
| npcs/villagers-{fem,masc} | Citizens-Guards-Warriors | 14 named town villagers |
| npcs/guards | Citizens-Guards-Warriors | Town guards |
| npcs/warriors | Citizens-Guards-Warriors | Town warrior NPCs |
| combatants/{warriors,rogues,mages} | warriors_rogues_mages | Rival trainers and gym leaders |
| effects/{weapon,magical} | warriors_rogues_mages | Combat FX |

## Bosses (fully animated, one of a kind)

| Dir | Source | States |
|---|---|---|
| bosses/green-dragon | Dragon (Green) + High_Dragon_Death_Animation | **final boss** — idle/hover/fly/launch/firebreath/melee/walk/death (12 sheets; the only creature with a dedicated death animation) |
| bosses/dread-knight | Heavy Knight | combat/non-combat/thrust-attack/thrust-dash |
| bosses/slime | Fan-tasy Slime | idle/walk/attack/death |
| bosses/fire-skull | Creature Extended | fire-skull + fireball projectile |
| bosses/zombie-burster | Creature Extended | burster + explosion-attack + death-explosion |

## Creatures (wild-encounter sprites, static)

| Dir | Source | Variants |
|---|---|---|
| creatures/goblin | Creature Extended | goblin, slinger |
| creatures/orc | Creature Extended | orc, archer, champion, soldier, soldier-unarmoured |
| creatures/skelly | Creature Extended | skelly, archer, warrior |
| creatures/zombie | Creature Extended | zombie (base; burster split to bosses/) |
| creatures/mummy | Creature Extended | mummy |
| creatures/wraith | Creature Extended | wraith |

Original archives preserved in `pending/`. Per-pack license files live inside each original archive.
