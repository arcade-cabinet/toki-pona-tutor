import { createWorld } from 'koota';
import {
  Position,
  Player,
  NPC,
  Interactable,
  DialogOwner,
  QuestGiver,
  Collectible,
  SpriteKey,
  Named,
  Health,
} from './traits';

export const world = createWorld();

export function spawnPlayer(x: number, y: number) {
  return world.spawn(
    Player,
    Position({ x, y }),
    SpriteKey({ key: 'player' }),
    Health({ hp: 3, max: 3 }),
    Named({ name: 'soweli' })
  );
}

export interface SpawnNpcOpts {
  x: number;
  y: number;
  npcId: string;
  name: string;
  spriteKey: string;
  dialogKey: string;
  questId?: string;
}

export function spawnNpc(opts: SpawnNpcOpts) {
  const entity = world.spawn(
    NPC({ npcId: opts.npcId }),
    Position({ x: opts.x, y: opts.y }),
    SpriteKey({ key: opts.spriteKey }),
    Named({ name: opts.name }),
    Interactable({ radius: 40 }),
    DialogOwner({ dialogKey: opts.dialogKey })
  );
  if (opts.questId) {
    entity.add(QuestGiver({ questId: opts.questId }));
  }
  return entity;
}

export interface SpawnItemOpts {
  x: number;
  y: number;
  itemId: string;
  spriteKey: string;
}

export function spawnItem(opts: SpawnItemOpts) {
  return world.spawn(
    Position({ x: opts.x, y: opts.y }),
    SpriteKey({ key: opts.spriteKey }),
    Interactable({ radius: 24 }),
    Collectible({ itemId: opts.itemId, collected: false })
  );
}

export function resetWorld() {
  world.reset();
}
