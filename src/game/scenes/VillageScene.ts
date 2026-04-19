import * as Phaser from 'phaser';
import { gameBus } from '../GameBus';
import { spawnPlayer, spawnNpc, spawnItem } from '../ecs/world';
import { TOWN, DUNGEON, CAST } from '../tiles';
import { pickUpItem, getQuestState } from '../ecs/questState';
import { loadSeed } from '../procgen/seed';
import { planVillage, type VillagePlan } from '../procgen/villageGen';

const TILE = 16;
const MAP_W = 28;
const MAP_H = 18;
const BASE = import.meta.env.BASE_URL;

// Simple village layout approach: one grass base, one cobbled plaza in the
// middle (tile 43 STONE_FLOOR), a few single-tile decorations (tent=104,
// bushes, trees) for landmarks, NPCs + items placed with clear sightlines.
// NO multi-tile house composition — the packed Tiny Town sheet is badly
// suited to hand-assembly at our scale. Single-icon landmarks read cleaner.

function grassVariant(x: number, y: number): number {
  const h = (x * 73856093) ^ (y * 19349663);
  const r = Math.abs(h) % 24;
  if (r === 0) return TOWN.GRASS_FLOWERS;
  if (r < 2) return TOWN.GRASS_DETAIL;
  return TOWN.GRASS;
}

export class VillageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private npcs: Array<{ sprite: Phaser.GameObjects.Sprite; npcId: string; label: Phaser.GameObjects.Text }> = [];
  private items: Array<{ sprite: Phaser.GameObjects.Sprite; itemId: string }> = [];
  private colliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private dialogOpen = false;
  private unsubs: Array<() => void> = [];
  private interactPrompt!: Phaser.GameObjects.Text;
  private questMarker!: Phaser.GameObjects.Text;

  constructor() {
    super('VillageScene');
  }

  preload() {
    this.load.spritesheet('town', `${BASE}rpg/tiles/tilemap_packed.png`, {
      frameWidth: TILE,
      frameHeight: TILE,
      spacing: 0,
    });
    this.load.spritesheet('dungeon', `${BASE}rpg/tiles/dungeon_packed.png`, {
      frameWidth: TILE,
      frameHeight: TILE,
      spacing: 0,
    });
  }

  private villagePlan!: VillagePlan;

  create() {
    const seed = loadSeed();
    this.villagePlan = seed
      ? planVillage(seed)
      : planVillage({ noun: 'ma', adj1: 'pona', adj2: 'suli' });
    this.cameras.main.setBackgroundColor(this.villagePlan.biome.skyColor);
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.colliders = this.physics.add.staticGroup();

    this.paintGrass();
    this.paintPlaza();
    this.paintLandmarks();
    this.paintEdgeTrees();

    this.spawnEntities();
    this.setupControls();
    this.setupBus();
    this.setupHud();

    this.physics.add.collider(this.player, this.colliders);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.resizeCamera();
    this.scale.on('resize', () => this.resizeCamera());
  }

  private resizeCamera() {
    const cw = this.cameras.main.width;
    const ch = this.cameras.main.height;
    // Aim to show 14-18 tiles on the shorter axis so village feels spacious.
    const zoom = Math.max(1.5, Math.min(cw / (18 * TILE), ch / (12 * TILE)));
    this.cameras.main.setZoom(zoom);
  }

  private tile(x: number, y: number, frame: number, sheet: 'town' | 'dungeon' = 'town', depth = 0) {
    const img = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, sheet, frame);
    img.setDepth(depth);
    return img;
  }

  private paintGrass() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        this.tile(x, y, grassVariant(x, y));
      }
    }
  }

  // Cobblestone plaza in the middle of the village, 6×4 tiles.
  private paintPlaza() {
    const px = 11;
    const py = 7;
    const pw = 6;
    const ph = 4;
    for (let y = py; y < py + ph; y++) {
      for (let x = px; x < px + pw; x++) {
        this.tile(x, y, TOWN.STONE_FLOOR, 'town', 1);
      }
    }
  }

  // Landmark icons — single-tile objects that read clearly.
  private paintLandmarks() {
    // 3 icon-buildings around the plaza (using roof-peak tiles as 1-tile houses)
    const houses: Array<[number, number, number]> = [
      [9, 6, TOWN.HOUSE_ICON_BLUE],
      [17, 6, TOWN.HOUSE_ICON_RED],
      [13, 11, TOWN.HOUSE_ICON_BLUE],
    ];
    for (const [tx, ty, t] of houses) {
      this.tile(tx, ty, t, 'town', 2);
      this.addCollider(tx, ty);
    }

    // A couple of signposts
    this.tile(11, 11, TOWN.SIGN_POST, 'town', 2);
    this.addCollider(11, 11);

    // A garden of mushrooms south of plaza (where the kili will be)
    const gx = 19;
    const gy = 11;
    for (let dx = 0; dx < 4; dx++) {
      this.tile(gx + dx, gy, TOWN.MUSHROOMS, 'town', 2);
      this.tile(gx + dx, gy + 1, TOWN.GRASS_FLOWERS, 'town', 1);
    }

    // Scattered bushes for texture — only verified-complete tile shapes.
    const bushes: Array<[number, number, number]> = [
      [5, 4, TOWN.BUSH_GREEN],
      [5, 10, TOWN.BUSH_GREEN],
      [22, 4, TOWN.TREE_GREEN_ROUND],
      [22, 12, TOWN.BUSH_GREEN],
      [6, 14, TOWN.BUSH_GREEN],
      [16, 3, TOWN.BUSH_GREEN],
    ];
    for (const [tx, ty, t] of bushes) {
      this.tile(tx, ty, t, 'town', 2);
      this.addCollider(tx, ty);
    }

    // A single big tree as a landmark
    this.tile(14, 3, TOWN.TREE_GREEN_ROUND, 'town', 2);
    this.addCollider(14, 3);
  }

  private addCollider(tx: number, ty: number) {
    const r = this.colliders!.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '');
    r.setVisible(false).setSize(TILE, TILE).refreshBody();
  }

  private paintEdgeTrees() {
    // Cluster trees around edges so world has a soft forest boundary
    // rather than a brittle single-tile border.
    const seen = new Set<string>();
    const place = (tx: number, ty: number, frame: number) => {
      const k = `${tx},${ty}`;
      if (seen.has(k)) return;
      seen.add(k);
      this.tile(tx, ty, frame, 'town', 2);
      this.addCollider(tx, ty);
    };
    // Tree frames come from the seed's biome theme so each seed looks distinct.
    const treeFrames = this.villagePlan.biome.treeFrames;
    const pick = (x: number, y: number) => treeFrames[(x * 13 + y * 7) % treeFrames.length];
    // Top edge (two rows of offset trees)
    for (let x = 0; x < MAP_W; x++) {
      place(x, 0, pick(x, 0));
      if (x % 2 === 0) place(x, 1, pick(x, 1));
    }
    // Bottom edge
    for (let x = 0; x < MAP_W; x++) {
      place(x, MAP_H - 1, pick(x, MAP_H - 1));
      if (x % 2 === 0) place(x, MAP_H - 2, pick(x, MAP_H - 2));
    }
    // Left edge
    for (let y = 0; y < MAP_H; y++) {
      place(0, y, pick(0, y));
      if (y % 2 === 0) place(1, y, pick(1, y));
    }
    // Right edge
    for (let y = 0; y < MAP_H; y++) {
      place(MAP_W - 1, y, pick(MAP_W - 1, y));
      if (y % 2 === 0) place(MAP_W - 2, y, pick(MAP_W - 2, y));
    }
  }

  private spawnEntities() {
    // Player spawns just west of plaza
    const px = 7 * TILE + TILE / 2;
    const py = 9 * TILE + TILE / 2;
    this.player = this.physics.add.sprite(px, py, 'dungeon', CAST.PLAYER);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(10, 10).setOffset(3, 5);
    this.player.setDepth(5);
    spawnPlayer(px, py);

    // jan Pona at left tent
    this.makeNpc(9, 7, 'jan_pona', 'jan Pona', CAST.JAN_PONA, 'hungry_friend');

    // jan Telo at right tent
    this.makeNpc(17, 7, 'jan_telo', 'jan Telo', CAST.JAN_TELO);

    // Kili in the mushroom garden
    const kx = 20 * TILE + TILE / 2;
    const ky = 11 * TILE + TILE / 2;
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

    // akesi — the scared reptile guarding the garden. Blocks the path to
    // the kili until the player 'calms it with words' via combat.
    const ax = 19 * TILE + TILE / 2;
    const ay = 11 * TILE + TILE / 2;
    const akesi = this.add.sprite(ax, ay, 'dungeon', DUNGEON.ORC_RED);
    akesi.setDepth(5);
    this.tweens.add({
      targets: akesi,
      x: ax - 3,
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: 'Sine.easeInOut',
    });
    this.akesiSprite = akesi;
  }

  private akesiSprite: Phaser.GameObjects.Sprite | null = null;
  private akesiDefeated = false;
  private combatDistanceTriggered = false;

  private checkAkesiProximity() {
    if (this.akesiDefeated || !this.akesiSprite || this.dialogOpen) return;
    if (this.combatDistanceTriggered) return;
    const d = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.akesiSprite.x,
      this.akesiSprite.y
    );
    if (d < 40) {
      this.combatDistanceTriggered = true;
      this.dialogOpen = true;
      gameBus.emit('combat:enter', { enemyId: 'pipi_loje' });
    }
  }

  private makeNpc(tx: number, ty: number, npcId: string, name: string, spriteFrame: number, questId?: string) {
    // Place NPC just south of their building so they stand "in front of" it
    const x = tx * TILE + TILE / 2;
    const y = (ty + 1) * TILE + TILE / 2;
    const sprite = this.add.sprite(x, y, 'dungeon', spriteFrame);
    sprite.setDepth(5);
    const label = this.add
      .text(x, y - 14, name, {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#ffffff',
        backgroundColor: '#222',
        padding: { left: 2, right: 2, top: 0, bottom: 0 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(50);
    this.npcs.push({ sprite, npcId, label });
    spawnNpc({
      x,
      y,
      npcId,
      name,
      spriteKey: npcId,
      dialogKey: `${npcId}_intro`,
      questId,
    });
  }

  private setupControls() {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
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
        backgroundColor: '#ea580c',
        padding: { left: 3, right: 3, top: 1, bottom: 1 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(100)
      .setVisible(false);

    // Quest marker "!" over jan Pona while quest is pending
    this.questMarker = this.add
      .text(0, 0, '!', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#fde047',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(50)
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
    this.unsubs.push(
      gameBus.on('combat:victory', () => {
        // Remove akesi and allow kili pickup
        this.akesiDefeated = true;
        this.akesiSprite?.setVisible(false);
        this.dialogOpen = false;
        this.combatDistanceTriggered = false;
      })
    );
    this.unsubs.push(
      gameBus.on('combat:defeat', () => {
        // Bounce the player back away from the akesi
        this.dialogOpen = false;
        this.combatDistanceTriggered = false;
        if (this.player && this.akesiSprite) {
          const dx = this.player.x - this.akesiSprite.x;
          const dy = this.player.y - this.akesiSprite.y;
          const len = Math.max(1, Math.hypot(dx, dy));
          this.player.x += (dx / len) * 60;
          this.player.y += (dy / len) * 60;
        }
      })
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private nearestInteractable(): {
    kind: 'npc' | 'item';
    sprite: Phaser.GameObjects.Sprite;
    id: string;
  } | null {
    const pr = 28;
    let best: { d: number; target: any } | null = null;
    for (const n of this.npcs) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, n.sprite.x, n.sprite.y);
      if (d <= pr && (!best || d < best.d)) best = { d, target: { kind: 'npc', sprite: n.sprite, id: n.npcId } };
    }
    for (const it of this.items) {
      if (!it.sprite.visible) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.sprite.x, it.sprite.y);
      if (d <= pr && (!best || d < best.d)) best = { d, target: { kind: 'item', sprite: it.sprite, id: it.itemId } };
    }
    return best?.target ?? null;
  }

  private tryInteract() {
    if (this.dialogOpen) return;
    const t = this.nearestInteractable();
    if (!t) return;
    if (t.kind === 'npc') {
      this.dialogOpen = true;
      gameBus.emit('dialog:open', { npcId: t.id });
    } else if (t.kind === 'item') {
      t.sprite.setVisible(false);
      pickUpItem(t.id);
      gameBus.emit('word:learned', { word: t.id });
      gameBus.emit('toast:show', {
        kind: 'celebration',
        title: `+ ${t.id}`,
        body:
          getQuestState().hungryFriend === 'item_found'
            ? 'Take it to jan Pona!'
            : 'Picked up',
        ttlMs: 2500,
      });
    }
  }

  update(_time: number, _delta: number) {
    if (this.dialogOpen) {
      this.player.setVelocity(0);
      this.interactPrompt.setVisible(false);
      this.questMarker.setVisible(false);
      return;
    }
    const speed = 95;
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

    // Interact prompt follows nearest interactable
    const target = this.nearestInteractable();
    if (target) {
      this.interactPrompt.setVisible(true);
      this.interactPrompt.setPosition(target.sprite.x, target.sprite.y - 16);
    } else {
      this.interactPrompt.setVisible(false);
    }

    // Quest '!' marker bobs over jan Pona while quest is pending
    const stage = getQuestState().hungryFriend;
    const pona = this.npcs.find((n) => n.npcId === 'jan_pona');
    if (pona && (stage === 'not_started' || stage === 'item_found')) {
      this.questMarker.setVisible(true);
      const bob = Math.sin(this.time.now * 0.005) * 2;
      this.questMarker.setPosition(pona.sprite.x, pona.sprite.y - 24 + bob);
    } else {
      this.questMarker.setVisible(false);
    }

    // Akesi proximity check — triggers combat when player gets close
    this.checkAkesiProximity();
  }
}
