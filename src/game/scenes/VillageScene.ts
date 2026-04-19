import * as Phaser from 'phaser';
import { gameBus } from '../GameBus';
import { spawnPlayer, spawnNpc, spawnItem } from '../ecs/world';
import { TOWN, DUNGEON, CAST } from '../tiles';

const TILE = 16;
const MAP_W = 24;
const MAP_H = 16;
const BASE = import.meta.env.BASE_URL;

// Deterministic small-hash pick of grass variants so it doesn't look flat.
function grassVariant(x: number, y: number): number {
  const h = (x * 73856093) ^ (y * 19349663);
  const r = Math.abs(h) % 20;
  if (r === 0) return TOWN.GRASS_FLOWERS;
  if (r < 3) return TOWN.GRASS_DETAIL;
  return TOWN.GRASS;
}

export class VillageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private npcs: Array<{ sprite: Phaser.GameObjects.Sprite; npcId: string }> = [];
  private items: Array<{ sprite: Phaser.GameObjects.Sprite; itemId: string }> = [];
  private colliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private dialogOpen = false;
  private unsubs: Array<() => void> = [];
  private interactPrompt!: Phaser.GameObjects.Text;

  constructor() {
    super('VillageScene');
  }

  preload() {
    this.load.spritesheet('town', `${BASE}rpg/tiles/tilemap_packed.png`, {
      frameWidth: TILE,
      frameHeight: TILE,
      spacing: 1,
    });
    this.load.spritesheet('dungeon', `${BASE}rpg/tiles/dungeon_packed.png`, {
      frameWidth: TILE,
      frameHeight: TILE,
      spacing: 1,
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#7bb65a');
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.colliders = this.physics.add.staticGroup();

    this.paintGrass();
    this.paintPath();
    this.paintHouses();
    this.paintGarden();
    this.paintBorderTrees();
    this.paintProps();

    this.spawnEntities();
    this.setupControls();
    this.setupBus();
    this.setupHud();

    this.physics.add.collider(this.player, this.colliders);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Auto-compute zoom to fit scene on current canvas size so everything is visible
    this.resizeCamera();
    this.scale.on('resize', () => this.resizeCamera());
  }

  private resizeCamera() {
    const cw = this.cameras.main.width;
    const ch = this.cameras.main.height;
    // Target: show ~12 tiles across minimum so UI is legible on mobile.
    const zoom = Math.max(1.5, Math.min(cw / (12 * TILE), ch / (8 * TILE)));
    this.cameras.main.setZoom(zoom);
  }

  private tileAt(x: number, y: number, frame: number, sheet: 'town' | 'dungeon' = 'town', depth = 0) {
    const img = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, sheet, frame);
    img.setDepth(depth);
    return img;
  }

  private paintGrass() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.tileAt(x, y, grassVariant(x, y));
      }
    }
  }

  // Vertical path from top to bottom through column 11, plus a horizontal spur west.
  private paintPath() {
    const col = 11;
    // vertical main path
    for (let y = 1; y < MAP_H - 1; y++) {
      this.tileAt(col, y, TOWN.PATH_TM, 'town', 1);
    }
    // top cap / bottom cap
    this.tileAt(col, 0, TOWN.PATH_TM, 'town', 1);
    this.tileAt(col, MAP_H - 1, TOWN.PATH_TM, 'town', 1);
    // horizontal spur at y=7 going left to x=3 (to jan Pona's house)
    const spurY = 7;
    for (let x = 3; x <= col; x++) {
      this.tileAt(x, spurY, TOWN.PATH_MM, 'town', 1);
    }
    // spur right to jan Telo's at x=18
    for (let x = col; x <= 18; x++) {
      this.tileAt(x, spurY, TOWN.PATH_MM, 'town', 1);
    }
  }

  // A single 2×3 house at the given top-left tile coord.
  private placeHouse(tx: number, ty: number, variant: 'blue' | 'red') {
    const roofL = variant === 'blue' ? TOWN.H_BLUE_ROOF_L : TOWN.H_RED_ROOF_L;
    const roofR = variant === 'blue' ? TOWN.H_BLUE_ROOF_R : TOWN.H_RED_ROOF_R;
    const wallL = variant === 'blue' ? TOWN.H_BLUE_WALL_L : TOWN.H_RED_WALL_L;
    const wallR = variant === 'blue' ? TOWN.H_BLUE_WALL_R : TOWN.H_RED_WALL_R;
    const baseL = variant === 'blue' ? TOWN.H_BLUE_BASE_L : TOWN.H_RED_BASE_L;
    const baseD = variant === 'blue' ? TOWN.H_BLUE_BASE_DOOR : TOWN.H_RED_BASE_DOOR;

    this.tileAt(tx, ty, roofL, 'town', 2);
    this.tileAt(tx + 1, ty, roofR, 'town', 2);
    this.tileAt(tx, ty + 1, wallL, 'town', 2);
    this.tileAt(tx + 1, ty + 1, wallR, 'town', 2);
    this.tileAt(tx, ty + 2, baseL, 'town', 2);
    this.tileAt(tx + 1, ty + 2, baseD, 'town', 2);

    // Make the walls solid (except the door tile so NPCs can stand near it)
    this.addCollider(tx, ty + 1);
    this.addCollider(tx + 1, ty + 1);
    this.addCollider(tx, ty + 2);
  }

  private addCollider(tx: number, ty: number) {
    const r = this.colliders!.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '');
    r.setVisible(false).setSize(TILE, TILE).refreshBody();
  }

  private paintHouses() {
    // jan Pona's house — blue roof, west side of path, at grass y=4-6, x=2-3
    this.placeHouse(2, 4, 'blue');
    // jan Telo's house — red roof, east side of path, at y=4-6, x=17-18
    this.placeHouse(17, 4, 'red');
  }

  // Fenced garden bottom-center with flowers + kili inside.
  private paintGarden() {
    const gx = 9; // start col
    const gy = 12; // start row
    const gw = 5; // cols
    // Fence top row
    this.tileAt(gx, gy, TOWN.FENCE_L, 'town', 2);
    for (let i = 1; i < gw - 1; i++) this.tileAt(gx + i, gy, TOWN.FENCE_M, 'town', 2);
    this.tileAt(gx + gw - 1, gy, TOWN.FENCE_R, 'town', 2);
    // Interior — flowers / dirt
    for (let i = 0; i < gw; i++) {
      for (let j = 1; j < 3; j++) {
        this.tileAt(gx + i, gy + j, TOWN.GRASS_FLOWERS, 'town', 1);
      }
    }
    // Bottom fence
    this.tileAt(gx, gy + 3, TOWN.FENCE_L, 'town', 2);
    for (let i = 1; i < gw - 1; i++) this.tileAt(gx + i, gy + 3, TOWN.FENCE_M, 'town', 2);
    this.tileAt(gx + gw - 1, gy + 3, TOWN.FENCE_R, 'town', 2);
    // A sign next to the garden
    this.tileAt(gx - 1, gy + 1, TOWN.SIGN_POST, 'town', 2);
    this.addCollider(gx - 1, gy + 1);
  }

  private paintBorderTrees() {
    for (let x = 0; x < MAP_W; x++) {
      if (x < 1 || x > MAP_W - 2) continue;
      this.tileAt(x, 0, TOWN.TREE_GREEN_TALL_1, 'town', 2);
      this.addCollider(x, 0);
    }
    for (let y = 0; y < MAP_H; y++) {
      this.tileAt(0, y, TOWN.TREE_GREEN_TALL_2, 'town', 2);
      this.addCollider(0, y);
      this.tileAt(MAP_W - 1, y, TOWN.TREE_GREEN_TALL_3, 'town', 2);
      this.addCollider(MAP_W - 1, y);
    }
    // Scattered trees inside
    const extraTrees: Array<[number, number, number]> = [
      [5, 2, TOWN.TREE_ORANGE_1],
      [6, 11, TOWN.TREE_GREEN_ROUND],
      [16, 11, TOWN.TREE_ORANGE_2],
      [20, 3, TOWN.TREE_GREEN_TALL_1],
      [7, 14, TOWN.BUSH_GREEN],
      [15, 14, TOWN.BUSH_ORANGE],
    ];
    for (const [tx, ty, tile] of extraTrees) {
      this.tileAt(tx, ty, tile, 'town', 2);
      this.addCollider(tx, ty);
    }
  }

  private paintProps() {
    // A tent near top center for atmosphere
    this.tileAt(12, 2, TOWN.TENT, 'town', 2);
    this.addCollider(12, 2);
    // Mushroom cluster near tree shade
    this.tileAt(6, 3, TOWN.MUSHROOMS, 'town', 2);
  }

  private spawnEntities() {
    const spurY = 7;

    // Player at far-left of spur, so they enter from the west
    const px = 4 * TILE + TILE / 2;
    const py = spurY * TILE + TILE / 2;
    this.player = this.physics.add.sprite(px, py, 'dungeon', CAST.PLAYER);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(10, 10).setOffset(3, 5);
    this.player.setDepth(5);
    spawnPlayer(px, py);

    // jan Pona stands at their door (house 2,4 → door at 3,6 → place NPC at 3, 7 on the spur, 1 tile south of door)
    const ponaX = 3 * TILE + TILE / 2;
    const ponaY = (spurY - 0) * TILE + TILE / 2;
    const pona = this.add.sprite(ponaX, ponaY, 'dungeon', CAST.JAN_PONA);
    pona.setDepth(5);
    this.npcs.push({ sprite: pona, npcId: 'jan_pona' });
    spawnNpc({
      x: ponaX,
      y: ponaY,
      npcId: 'jan_pona',
      name: 'jan Pona',
      spriteKey: 'kid',
      dialogKey: 'jan_pona_intro',
      questId: 'hungry_friend',
    });

    // jan Telo stands at their door
    const teloX = 18 * TILE + TILE / 2;
    const teloY = spurY * TILE + TILE / 2;
    const telo = this.add.sprite(teloX, teloY, 'dungeon', CAST.JAN_TELO);
    telo.setDepth(5);
    this.npcs.push({ sprite: telo, npcId: 'jan_telo' });
    spawnNpc({
      x: teloX,
      y: teloY,
      npcId: 'jan_telo',
      name: 'jan Telo',
      spriteKey: 'girl',
      dialogKey: 'jan_telo_hint',
    });

    // kili sits in the fenced garden
    const kx = 11 * TILE + TILE / 2;
    const ky = 13 * TILE + TILE / 2;
    const kili = this.add.sprite(kx, ky, 'dungeon', DUNGEON.POTION_RED);
    kili.setDepth(5);
    this.tweens.add({
      targets: kili,
      y: ky - 2,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut',
    });
    this.items.push({ sprite: kili, itemId: 'kili' });
    spawnItem({ x: kx, y: ky, itemId: 'kili', spriteKey: 'kili' });
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    const kb = this.input.keyboard!;
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    const spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.interactKey.on('down', () => this.tryInteract());
    spaceKey.on('down', () => this.tryInteract());
  }

  private setupHud() {
    this.interactPrompt = this.add
      .text(0, 0, 'E', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: '#222',
        padding: { left: 3, right: 3, top: 1, bottom: 1 },
      })
      .setDepth(100)
      .setVisible(false);
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

  private nearestInteractable(): { kind: 'npc' | 'item'; sprite: Phaser.GameObjects.Sprite; id: string } | null {
    const pr = 26;
    let best: { d: number; target: any } | null = null;
    for (const npc of this.npcs) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y);
      if (d <= pr && (!best || d < best.d)) best = { d, target: { kind: 'npc', sprite: npc.sprite, id: npc.npcId } };
    }
    for (const item of this.items) {
      if (!item.sprite.visible) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.sprite.x, item.sprite.y);
      if (d <= pr && (!best || d < best.d)) best = { d, target: { kind: 'item', sprite: item.sprite, id: item.itemId } };
    }
    return best?.target ?? null;
  }

  private tryInteract() {
    if (this.dialogOpen) return;
    const target = this.nearestInteractable();
    if (!target) return;
    if (target.kind === 'npc') {
      this.dialogOpen = true;
      gameBus.emit('dialog:open', { npcId: target.id });
    } else if (target.kind === 'item') {
      target.sprite.setVisible(false);
      gameBus.emit('word:learned', { word: target.id });
    }
  }

  update(_time: number, _delta: number) {
    if (this.dialogOpen) {
      this.player.setVelocity(0);
      this.interactPrompt.setVisible(false);
      return;
    }
    const speed = 90;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left?.isDown || this.wasd.A.isDown) vx = -speed;
    else if (this.cursors.right?.isDown || this.wasd.D.isDown) vx = speed;
    if (this.cursors.up?.isDown || this.wasd.W.isDown) vy = -speed;
    else if (this.cursors.down?.isDown || this.wasd.S.isDown) vy = speed;
    this.player.setVelocity(vx, vy);
    if (vx !== 0 || vy !== 0) {
      const bob = 1 + Math.sin(this.time.now * 0.02) * 0.1;
      this.player.setScale(1, bob);
    } else {
      this.player.setScale(1, 1);
    }

    // Interact prompt bobbing above nearest interactable
    const target = this.nearestInteractable();
    if (target) {
      this.interactPrompt.setVisible(true);
      this.interactPrompt.setPosition(target.sprite.x - 4, target.sprite.y - 22);
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}
