import * as Phaser from 'phaser';
import { gameBus } from '../GameBus';
import { getRegion, getStartRegionId } from '../content/loader';
import { resolveTileKey } from '../content/tile-keys';
import type { Region, Npc, Sign, Warp } from '../../content/schema';
import {
  getSave,
  setCurrentRegion,
  addItem,
  addToParty,
  setFlag,
  advanceQuest,
  type PartyMember,
} from '../ecs/saveState';
import { getSpecies, getMove } from '../content/loader';

const TILE = 16;
const BASE = import.meta.env.BASE_URL;

/**
 * Generic region scene — paints any region from `generated/world.json`.
 *
 * Replaces the old hand-coded `VillageScene`. On create, looks at the
 * save's `current_region_id` (falling back to `world.start_region_id`)
 * and paints that region's tile layers, spawns its NPCs/signs, arms its
 * warp tiles, and registers an encounter roll on the tall-grass keys.
 *
 * All dialog + combat happens via the existing Solid overlays — this
 * scene just emits bus events and lets the overlays handle presentation.
 */
export class RegionScene extends Phaser.Scene {
  private region!: Region;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private colliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private npcs: Array<{
    def: Npc;
    sprite: Phaser.GameObjects.Sprite;
    label: Phaser.GameObjects.Text;
  }> = [];
  private signs: Array<{ def: Sign; sprite: Phaser.GameObjects.Image }> = [];
  private warps: Warp[] = [];
  /** Per-tile solidity derived from the layer tile keys + region overrides. */
  private solidMap: boolean[][] = [];
  /** Tall-grass tile boolean map. */
  private grassMap: boolean[][] = [];
  private dialogOpen = false;
  private encounterCooldownMs = 0;
  private unsubs: Array<() => void> = [];
  private interactPrompt!: Phaser.GameObjects.Text;

  constructor() {
    super('RegionScene');
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

  create() {
    const save = getSave();
    const targetRegionId = save.current_region_id || getStartRegionId();
    const region = getRegion(targetRegionId);
    if (!region) {
      console.error(`[RegionScene] no region for id "${targetRegionId}"`);
      this.add
        .text(40, 40, `Region "${targetRegionId}" not in world.json.\nHave content PRs landed?`, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#fff',
        })
        .setDepth(100);
      return;
    }
    this.region = region;

    this.cameras.main.setBackgroundColor(region.sky_color);
    this.cameras.main.setBounds(0, 0, region.width * TILE, region.height * TILE);
    this.physics.world.setBounds(0, 0, region.width * TILE, region.height * TILE);
    this.colliders = this.physics.add.staticGroup();
    this.solidMap = Array.from({ length: region.height }, () => Array(region.width).fill(false));
    this.grassMap = Array.from({ length: region.height }, () => Array(region.width).fill(false));

    this.paintLayers(region);
    this.spawnNpcs(region);
    this.spawnSigns(region);
    this.registerWarps(region);

    // Player — spawn at saved tile if this is a re-enter, else at region.spawn.
    // Fall back to (0, 0) if a malformed world.json region omits the spawn;
    // malformed content is a schema-validation bug, but we survive it here.
    const spawnTile = save.current_region_id === region.id && save.player_tile
      ? save.player_tile
      : region.spawn ?? { x: 0, y: 0 };
    const px = spawnTile.x * TILE + TILE / 2;
    const py = spawnTile.y * TILE + TILE / 2;
    this.player = this.physics.add.sprite(px, py, 'dungeon', 85 /* villager yellow */);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(10, 10).setOffset(3, 5);
    this.player.setDepth(5);

    this.setupControls();
    this.setupBus();
    this.setupHud();

    this.physics.add.collider(this.player, this.colliders);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.resizeCamera();
    this.scale.on('resize', () => this.resizeCamera());

    // Remember where we are — if the player refreshes mid-region they come
    // back to the same spot.
    setCurrentRegion(region.id, spawnTile);
  }

  private resizeCamera() {
    const cw = this.cameras.main.width;
    const ch = this.cameras.main.height;
    const zoom = Math.max(1.5, Math.min(cw / (18 * TILE), ch / (12 * TILE)));
    this.cameras.main.setZoom(zoom);
  }

  private paintLayers(region: Region) {
    for (const layer of region.layers) {
      const solidKeyOverride = new Set(layer.solid_keys ?? []);
      for (let y = 0; y < layer.tiles.length; y++) {
        const row = layer.tiles[y];
        for (let x = 0; x < row.length; x++) {
          const key = row[x];
          if (key == null) continue;
          const res = resolveTileKey(key);
          if (!res) {
            if (import.meta.env.DEV) console.warn(`[RegionScene] unknown tile key "${key}"`);
            continue;
          }
          const img = this.add.image(
            x * TILE + TILE / 2,
            y * TILE + TILE / 2,
            res.sheet,
            res.frame,
          );
          img.setDepth(layer.depth ?? 0);
          if (res.color_overlay) {
            // Paint a solid color over the base tile (used for water — the
            // Kenney sheet has no water sprite, so we fake it).
            const overlay = this.add
              .rectangle(
                x * TILE + TILE / 2,
                y * TILE + TILE / 2,
                TILE,
                TILE,
                Phaser.Display.Color.HexStringToColor(res.color_overlay).color,
              )
              .setAlpha(0.78);
            overlay.setDepth((layer.depth ?? 0) + 0.1);
          }
          const solid = res.solid || solidKeyOverride.has(key);
          if (solid && this.colliders) {
            const r = this.colliders.create(
              x * TILE + TILE / 2,
              y * TILE + TILE / 2,
              '',
            );
            r.setVisible(false).setSize(TILE, TILE).refreshBody();
            this.solidMap[y][x] = true;
          }
          const isTallGrass = res.tall_grass || (region.tall_grass_keys ?? []).includes(key);
          if (isTallGrass) this.grassMap[y][x] = true;
        }
      }
    }
  }

  private spawnNpcs(region: Region) {
    for (const def of region.npcs) {
      const x = def.tile.x * TILE + TILE / 2;
      const y = def.tile.y * TILE + TILE / 2;
      const sprite = this.add.sprite(x, y, 'dungeon', def.sprite_frame);
      sprite.setDepth(5);
      const label = this.add
        .text(x, y - 14, def.name_tp, {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#ffffff',
          backgroundColor: '#222',
          padding: { left: 2, right: 2, top: 0, bottom: 0 },
        })
        .setOrigin(0.5, 0.5)
        .setDepth(50);
      this.npcs.push({ def, sprite, label });
    }
  }

  private spawnSigns(region: Region) {
    for (const def of region.signs) {
      const x = def.tile.x * TILE + TILE / 2;
      const y = def.tile.y * TILE + TILE / 2;
      const sprite = this.add.image(x, y, 'town', 92 /* sign post */);
      sprite.setDepth(2);
      this.signs.push({ def, sprite });
      // Signs are solid; paint a collider.
      if (this.colliders) {
        const r = this.colliders.create(x, y, '');
        r.setVisible(false).setSize(TILE, TILE).refreshBody();
      }
    }
  }

  private registerWarps(region: Region) {
    this.warps = [...region.warps];
  }

  private setupControls() {
    // In some Phaser configs / test envs `this.input.keyboard` is null —
    // bail cleanly instead of trusting the non-null assertion.
    const kb = this.input.keyboard;
    if (!kb) {
      console.error('[RegionScene] keyboard input not available; controls disabled');
      return;
    }
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
  }

  private setupBus() {
    this.unsubs.push(
      gameBus.on('dialog:close', () => {
        this.dialogOpen = false;
      }),
    );
    this.unsubs.push(
      gameBus.on('combat:victory', () => {
        this.dialogOpen = false;
        this.encounterCooldownMs = 1500;
      }),
    );
    this.unsubs.push(
      gameBus.on('combat:defeat', () => {
        this.dialogOpen = false;
        this.encounterCooldownMs = 1500;
      }),
    );
    this.unsubs.push(
      gameBus.on('combat:caught', () => {
        this.dialogOpen = false;
        this.encounterCooldownMs = 1500;
      }),
    );
  }

  private nearestNpc(): Npc | null {
    const pr = 28;
    let best: { d: number; npc: Npc } | null = null;
    for (const { def, sprite } of this.npcs) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (d <= pr && (!best || d < best.d)) best = { d, npc: def };
    }
    return best?.npc ?? null;
  }

  private tryInteract() {
    if (this.dialogOpen) return;
    const npc = this.nearestNpc();
    if (!npc) return;
    this.dialogOpen = true;
    gameBus.emit('dialog:open', { npcId: npc.id });
  }

  private checkWarps() {
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    const warp = this.warps.find((w) => w.tile.x === tx && w.tile.y === ty);
    if (!warp) return;
    this.dialogOpen = true; // lock input during transition
    setCurrentRegion(warp.to_region, warp.to_tile);
    this.scene.restart();
  }

  private rollEncounter(deltaMs: number) {
    if (this.encounterCooldownMs > 0) {
      this.encounterCooldownMs -= deltaMs;
      return;
    }
    if (!this.region.encounters || this.region.encounters.length === 0) return;
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    if (ty < 0 || ty >= this.grassMap.length) return;
    if (tx < 0 || tx >= this.grassMap[ty].length) return;
    if (!this.grassMap[ty][tx]) return;
    // ~8% chance per tile step. On a hit we set a long cooldown (post-combat
    // grace), on a miss a short per-step one so rolls happen tile-by-tile.
    if (Math.random() < 0.08) {
      const total = this.region.encounters.reduce((n, e) => n + e.weight, 0);
      if (total <= 0) {
        this.encounterCooldownMs = 300;
        return;
      }
      let roll = Math.random() * total;
      for (const e of this.region.encounters) {
        roll -= e.weight;
        if (roll <= 0) {
          this.dialogOpen = true;
          this.encounterCooldownMs = 1500;
          const level = Math.floor(
            e.min_level + Math.random() * (e.max_level - e.min_level + 1),
          );
          gameBus.emit('combat:enter', { enemyId: e.species_id, level });
          return;
        }
      }
    }
    this.encounterCooldownMs = 300;
  }

  update(_time: number, delta: number) {
    if (this.dialogOpen) {
      this.player.setVelocity(0);
      this.interactPrompt.setVisible(false);
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
      this.rollEncounter(delta);
      this.checkWarps();
    } else {
      this.player.setScale(1, 1);
    }

    const npc = this.nearestNpc();
    if (npc) {
      const x = npc.tile.x * TILE + TILE / 2;
      const y = npc.tile.y * TILE + TILE / 2;
      this.interactPrompt.setVisible(true);
      this.interactPrompt.setPosition(x, y - 16);
    } else {
      this.interactPrompt.setVisible(false);
    }
  }

  shutdown() {
    for (const u of this.unsubs) u();
    this.unsubs = [];
  }
}

/**
 * Helper for the starter ceremony flow — when dialog triggers a
 * `add_party`, the dialog layer calls this to materialize a PartyMember
 * from a species id + level.
 */
export function buildPartyMember(speciesId: string, level: number): PartyMember | null {
  const species = getSpecies(speciesId);
  if (!species) return null;
  const stats = species.base_stats;
  // Tiny stat curve: +2 per level per stat.
  const curveBonus = (level - 1) * 2;
  const maxHp = stats.hp + curveBonus;
  // Pick the first 4 moves whose unlock level the party-member meets.
  const moves = species.learnset
    .filter((l) => l.level <= level)
    .map((l) => l.move_id)
    .slice(-4);
  const pp = moves.map((mid) => getMove(mid)?.pp ?? 15);
  return {
    instance_id: `${speciesId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    species_id: speciesId,
    level,
    xp: 0,
    hp: maxHp,
    max_hp: maxHp,
    moves,
    pp,
  };
}

/** Internal helper used by the dialog-trigger handler to install a new party
 *  member from the `add_party` trigger. Exposed here so scene consumers can
 *  gift the starter without reaching into saveState guts. */
export function giftToParty(speciesId: string, level: number): boolean {
  const member = buildPartyMember(speciesId, level);
  if (!member) return false;
  return addToParty(member);
}

// Re-export a couple of state helpers the DialogOverlay uses when firing
// triggers from multi-beat nodes.
export { setFlag, advanceQuest, addItem };
