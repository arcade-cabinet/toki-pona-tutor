/**
 * Boot scene — preloads every asset Main needs, then hands off.
 *
 * Adapted from `remarkablegames/phaser-rpg`'s Boot scene; modernized
 * for Phaser 4 and our Stage 0 map-authoring toolchain (which emits
 * embedded .tmj files referencing PNG tilesets via relative paths
 * under `public/assets/`).
 *
 * Phaser's tilemap loader does NOT auto-fetch tileset PNGs even when
 * the .tmj has an embedded `image` field — `addTilesetImage(name, key)`
 * expects the texture to already be in the cache under `key`. We
 * preload each tileset PNG under a key matching its Tiled `name`, so
 * Main's `addTilesetImage(ts.name)` (no second arg) finds the texture.
 */
import * as Phaser from 'phaser';

import { key } from '../constants';
import { PLAYER_FRAME_SIZE } from '../sprites/Player';

const BASE = import.meta.env.BASE_URL;

/**
 * Tileset PNGs the active map(s) reference. Mirrors the `tilesets`
 * array in scripts/map-authoring/specs/ma_tomo_lili.ts. When a new
 * map needs a new tileset, add the entry here too — there's a
 * runtime warning ("Texture key not found") if a tileset is missing,
 * which is the trip-wire for forgotten preload registration.
 */
const CORE_TILESETS = [
  'Tileset_Ground',
  'Tileset_TallGrass',
  'Tileset_Water',
  'Tileset_Sand',
  'Tileset_Shadow',
] as const;

export class Boot extends Phaser.Scene {
  constructor() {
    super(key.scene.boot);
  }

  preload(): void {
    this.load.tilemapTiledJSON(
      key.tilemap.ma_tomo_lili,
      `${BASE}assets/maps/ma_tomo_lili.tmj`,
    );

    // Tileset PNGs — see CORE_TILESETS comment above. Path follows
    // the Fan-tasy core pack's published Art/<subdir>/<name>.png layout.
    // Phaser caches under the raw tileset name so `addTilesetImage(name)`
    // resolves without an explicit second arg.
    const tilesetSrc: Record<(typeof CORE_TILESETS)[number], string> = {
      Tileset_Ground: 'assets/tilesets/core/Art/Ground Tilesets/Tileset_Ground.png',
      Tileset_TallGrass: 'assets/tilesets/core/Art/Tall Grass Tilesets/Tileset_TallGrass.png',
      Tileset_Water: 'assets/tilesets/core/Art/Water and Sand/Tileset_Water.png',
      Tileset_Sand: 'assets/tilesets/core/Art/Water and Sand/Tileset_Sand.png',
      Tileset_Shadow: 'assets/tilesets/core/Art/Shadows/Atlas/Tileset_Shadow.png',
    };
    for (const name of CORE_TILESETS) {
      this.load.image(name, `${BASE}${tilesetSrc[name]}`);
    }

    // Player spritesheet — Fan-tasy Main Character, 32×32 frames, 5×6 grid.
    // See src/game/sprites/Player.ts for the row-per-direction layout.
    this.load.spritesheet(
      key.spritesheet.playerIdle,
      `${BASE}assets/player/idle.png`,
      { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE },
    );
    this.load.spritesheet(
      key.spritesheet.playerWalk,
      `${BASE}assets/player/walk.png`,
      { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE },
    );
  }

  create(): void {
    // 1×1 transparent texture used by Player's selector body and any
    // future invisible static probes. Generated programmatically so
    // there's no PNG to ship.
    if (!this.textures.exists(key.texture.pixel)) {
      const g = this.add.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 0);
      g.fillRect(0, 0, 1, 1);
      g.generateTexture(key.texture.pixel, 1, 1);
      g.destroy();
    }
    this.scene.start(key.scene.main);
  }
}
