import { trait } from 'koota';

// Spatial
export const Position = trait({ x: 0, y: 0 });
export const Velocity = trait({ vx: 0, vy: 0 });

// Identity
export const Named = trait({ name: '' });
export const Player = trait();
export const NPC = trait({ npcId: '' });
export const Interactable = trait({ radius: 32 });

// Dialog
export const DialogOwner = trait({ dialogKey: '' });

// Quest
export const QuestGiver = trait({ questId: '' });
export const QuestItem = trait({ itemId: '' });

// Collectible
export const Collectible = trait({
  itemId: '',
  collected: false,
});

// Rendering hint — Phaser reads these to mirror state
export const SpriteKey = trait({ key: '' });

// Health (for later combat)
export const Health = trait({ hp: 3, max: 3 });
