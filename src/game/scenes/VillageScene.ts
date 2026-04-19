import * as Phaser from 'phaser';
import { gameBus } from '../GameBus';
import { spawnPlayer, spawnNpc, spawnItem } from '../ecs/world';

const TILE = 16;
const MAP_W = 30;
const MAP_H = 20;
const BASE = import.meta.env.BASE_URL;

// Tile index picks from Tiny Town packed sheet (12 cols × 11 rows, 16px, 1px spacing).
// These are approximations; will be tuned once running in-browser.
const T = {
  GRASS: 0,
  GRASS_ALT: 1,
  PATH: 5,
  PATH_CROSS: 6,
  TREE: 12,
  BUSH: 13,
  HOUSE_TL: 48,
  HOUSE_TR: 49,
  HOUSE_BL: 60,
  HOUSE_BR: 61,
  SIGN: 84,
  FLOWER: 3,
  FRUIT: 120, // "kili" — yellow item
  PLAYER_A: 84, // monkey-like character frame
  PLAYER_B: 96,
  NPC_MARI: 85,
  NPC_TELO: 97,
};

export class VillageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private npcs: Array<{ sprite: Phaser.GameObjects.Sprite; npcId: string }> = [];
  private items: Array<{ sprite: Phaser.GameObjects.Sprite; itemId: string }> = [];
  private dialogOpen = false;
  private unsubs: Array<() => void> = [];

  constructor() {
    super('VillageScene');
  }

  preload() {
    this.load.spritesheet('town', `${BASE}rpg/tiles/tilemap_packed.png`, {
      frameWidth: TILE,
      frameHeight: TILE,
      spacing: 1,
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#6ab04c');
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);

    this.buildTilemap();
    this.spawnEntities();
    this.setupControls();
    this.setupBus();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
  }

  private buildTilemap() {
    // Grass base
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tileId = (x + y) % 5 === 0 ? T.GRASS_ALT : T.GRASS;
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'town', tileId);
      }
    }
    // Horizontal path through middle
    const pathY = Math.floor(MAP_H / 2);
    for (let x = 2; x < MAP_W - 2; x++) {
      this.add.image(x * TILE + TILE / 2, pathY * TILE + TILE / 2, 'town', T.PATH);
    }
    // Trees around the edges
    for (let x = 0; x < MAP_W; x++) {
      this.add.image(x * TILE + TILE / 2, 0 + TILE / 2, 'town', T.TREE);
      this.add.image(x * TILE + TILE / 2, (MAP_H - 1) * TILE + TILE / 2, 'town', T.TREE);
    }
    for (let y = 1; y < MAP_H - 1; y++) {
      this.add.image(0 + TILE / 2, y * TILE + TILE / 2, 'town', T.TREE);
      this.add.image((MAP_W - 1) * TILE + TILE / 2, y * TILE + TILE / 2, 'town', T.TREE);
    }
    // A couple of houses flanking the path
    this.placeHouse(6, pathY - 4);
    this.placeHouse(18, pathY - 4);
    // A garden patch of flowers (kili home)
    for (let i = 0; i < 5; i++) {
      this.add.image(
        (10 + i) * TILE + TILE / 2,
        (pathY + 4) * TILE + TILE / 2,
        'town',
        T.FLOWER
      );
    }
  }

  private placeHouse(tx: number, ty: number) {
    this.add.image(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 'town', T.HOUSE_TL);
    this.add.image((tx + 1) * TILE + TILE / 2, ty * TILE + TILE / 2, 'town', T.HOUSE_TR);
    this.add.image(tx * TILE + TILE / 2, (ty + 1) * TILE + TILE / 2, 'town', T.HOUSE_BL);
    this.add.image((tx + 1) * TILE + TILE / 2, (ty + 1) * TILE + TILE / 2, 'town', T.HOUSE_BR);
  }

  private spawnEntities() {
    // Player at village entrance (left side of path)
    const pathY = Math.floor(MAP_H / 2);
    const px = 3 * TILE + TILE / 2;
    const py = pathY * TILE + TILE / 2;
    this.player = this.physics.add.sprite(px, py, 'town', T.PLAYER_A);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(10, 10).setOffset(3, 5);
    spawnPlayer(px, py);

    // NPC 1: jan Pona in front of first house
    const n1x = 7 * TILE + TILE / 2;
    const n1y = (pathY - 2) * TILE + TILE / 2;
    const n1 = this.add.sprite(n1x, n1y, 'town', T.NPC_MARI);
    this.npcs.push({ sprite: n1, npcId: 'jan_pona' });
    spawnNpc({
      x: n1x,
      y: n1y,
      npcId: 'jan_pona',
      name: 'jan Pona',
      spriteKey: 'npc_pona',
      dialogKey: 'jan_pona_intro',
      questId: 'hungry_friend',
    });

    // NPC 2: jan Telo near garden
    const n2x = 14 * TILE + TILE / 2;
    const n2y = (pathY + 2) * TILE + TILE / 2;
    const n2 = this.add.sprite(n2x, n2y, 'town', T.NPC_TELO);
    this.npcs.push({ sprite: n2, npcId: 'jan_telo' });
    spawnNpc({
      x: n2x,
      y: n2y,
      npcId: 'jan_telo',
      name: 'jan Telo',
      spriteKey: 'npc_telo',
      dialogKey: 'jan_telo_hint',
    });

    // Kili item in the garden
    const kx = 12 * TILE + TILE / 2;
    const ky = (pathY + 4) * TILE + TILE / 2;
    const kili = this.add.sprite(kx, ky, 'town', T.FRUIT);
    this.tweens.add({
      targets: kili,
      y: ky - 2,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.easeInOut',
    });
    this.items.push({ sprite: kili, itemId: 'kili' });
    spawnItem({ x: kx, y: ky, itemId: 'kili', spriteKey: 'kili' });
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Walk-bob tween: simple 2-frame feel via scale pulse when moving
    this.interactKey.on('down', () => this.tryInteract());
  }

  private setupBus() {
    this.unsubs.push(
      gameBus.on('dialog:close', () => {
        this.dialogOpen = false;
      })
    );
    this.unsubs.push(
      gameBus.on('quiz:close', () => {
        this.dialogOpen = false;
      })
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private tryInteract() {
    if (this.dialogOpen) return;
    const pr = 32;
    for (const npc of this.npcs) {
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.sprite.x,
        npc.sprite.y
      );
      if (d <= pr) {
        this.dialogOpen = true;
        gameBus.emit('dialog:open', { npcId: npc.npcId });
        return;
      }
    }
    // Check items
    for (const item of this.items) {
      if (!item.sprite.visible) continue;
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.sprite.x,
        item.sprite.y
      );
      if (d <= 24) {
        item.sprite.setVisible(false);
        gameBus.emit('word:learned', { word: item.itemId });
        return;
      }
    }
  }

  update(_time: number, _delta: number) {
    if (this.dialogOpen) {
      this.player.setVelocity(0);
      return;
    }
    const speed = 80;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left?.isDown) vx = -speed;
    else if (this.cursors.right?.isDown) vx = speed;
    if (this.cursors.up?.isDown) vy = -speed;
    else if (this.cursors.down?.isDown) vy = speed;
    this.player.setVelocity(vx, vy);
    // Walk-bob: scale jiggle while moving
    if (vx !== 0 || vy !== 0) {
      const bob = 1 + Math.sin(this.time.now * 0.015) * 0.08;
      this.player.setScale(bob, bob);
    } else {
      this.player.setScale(1, 1);
    }
  }
}
