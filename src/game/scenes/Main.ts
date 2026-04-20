/**
 * Main scene — the overworld loop.
 *
 * Loads the current map (currently always `ma_tomo_lili`), wires
 * collisions on the World layer's `collides: true` tiles, spawns the
 * player at the SpawnPoint object, and hands ESC to the Menu scene
 * for pause / resume.
 *
 * Future iterations layer NPCs / signs / warps / encounters on top of
 * this — the Tiled object types are already enumerated in
 * src/game/constants/tilemap.ts.
 *
 * Adapted from `remarkablegames/phaser-rpg`'s Main scene; UI overlays
 * (typewriter, dialog) live in the Solid mount, not in-scene render
 * calls, so phaser-jsx is not used.
 */
import * as Phaser from 'phaser';

import { Depth, key, TilemapLayer, TilemapObject } from '../constants';
import { Player } from '../sprites/Player';

export class Main extends Phaser.Scene {
  private player!: Player;
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private worldLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  /** Bound ESC handler — kept on the instance so we can remove it on
   *  scene shutdown. Without this, every restart of Main would stack
   *  another keydown listener and pause/launch Menu N times per press. */
  private escHandler: (() => void) | null = null;

  constructor() {
    super(key.scene.main);
  }

  create(): void {
    this.tilemap = this.make.tilemap({ key: key.tilemap.ma_tomo_lili });

    // The TMJ embeds tileset definitions inline (Tiled's "Embed
    // Tilesets" export, which our author toolchain produces by
    // default). addTilesetImage by name walks the embedded list and
    // matches against tilesets the loader has already pulled via
    // their `image` field.
    const tilesets = this.tilemap.tilesets
      .map((ts) => this.tilemap.addTilesetImage(ts.name))
      .filter((t): t is Phaser.Tilemaps.Tileset => t !== null);

    // createLayer in Phaser 4 returns `TilemapLayer | TilemapGPULayer`
    // (the GPU variant when the optional `gpu` arg is true). We never
    // pass gpu=true, so the runtime value is always TilemapLayer; the
    // narrowing cast keeps TS happy without changing behavior. Optional
    // layers are skipped when the map doesn't declare them (Phaser logs
    // a warning otherwise).
    type TLayer = Phaser.Tilemaps.TilemapLayer;
    const declared = new Set(this.tilemap.layers.map((l) => l.name));
    const tryLayer = (name: TilemapLayer): TLayer | null =>
      declared.has(name)
        ? (this.tilemap.createLayer(name, tilesets, 0, 0) as TLayer | null)
        : null;

    tryLayer(TilemapLayer.BelowPlayer);
    const world = tryLayer(TilemapLayer.World);
    if (world) {
      world.setCollisionByProperty({ collides: true });
      this.worldLayer = world;
    }
    const above = tryLayer(TilemapLayer.AbovePlayer);
    above?.setDepth(Depth.AbovePlayer);

    this.cameras.main.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
    this.physics.world.bounds.width = this.tilemap.widthInPixels;
    this.physics.world.bounds.height = this.tilemap.heightInPixels;

    this.spawnPlayer();
    if (this.worldLayer) this.physics.add.collider(this.player, this.worldLayer);

    // Register ESC → pause + launch Menu. Stored on the instance so
    // the SHUTDOWN handler below can remove it; otherwise restarts of
    // Main (e.g. after a warp) would stack additional listeners.
    this.escHandler = () => {
      this.scene.pause(key.scene.main);
      this.scene.launch(key.scene.menu);
    };
    this.input.keyboard?.on('keydown-ESC', this.escHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.escHandler) {
        this.input.keyboard?.off('keydown-ESC', this.escHandler);
        this.escHandler = null;
      }
    });
  }

  private spawnPlayer(): void {
    // Match by Tiled object `type` — the spec emits "SpawnPoint" as the
    // type via TilemapObject.SpawnPoint, so this can't collide with an
    // unrelated object that happens to be named "default".
    const spawn = this.tilemap.findObject(
      TilemapLayer.Objects,
      ({ type }) => type === TilemapObject.SpawnPoint,
    );
    // Tiled object `x` / `y` are the top-left corner of the tile (in
    // pixels), but `Phaser.GameObjects.Sprite` is centered on its
    // position — without a half-tile offset, the player spawns half
    // a tile up-and-left of where the spec asked. Falls back to map
    // center if the SpawnPoint is missing (validator should have
    // caught it, but the engine survives if not).
    const halfTile = { x: this.tilemap.tileWidth / 2, y: this.tilemap.tileHeight / 2 };
    const spawnX = spawn ? (spawn.x ?? 0) + halfTile.x : this.tilemap.widthInPixels / 2;
    const spawnY = spawn ? (spawn.y ?? 0) + halfTile.y : this.tilemap.heightInPixels / 2;
    this.player = new Player(this, spawnX, spawnY);
  }

  update(): void {
    this.player.update();
  }
}
