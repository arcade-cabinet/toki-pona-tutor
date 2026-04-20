import type { RpgPlayer } from '@rpgjs/server';
import { preferences, KEYS } from '../../platform/persistence/preferences';
import { playDialog } from './dialog';

/**
 * Maps considered "safe" — arriving at one updates the respawn anchor.
 * These are villages, not routes or gyms. When the player is defeated
 * in combat, they wake up at the most recently visited safe map.
 *
 * Keep in sync with docs/JOURNEY.md beat types: only beats whose
 * narrative describes a village belong here.
 */
const SAFE_MAPS: Record<string, { x: number; y: number }> = {
    ma_tomo_lili: { x: 128, y: 128 },
    ma_telo: { x: 32, y: 96 },
    ma_lete: { x: 32, y: 96 },
};

const DEFAULT_RESPAWN = { mapId: 'ma_tomo_lili', x: 128, y: 128 };

/**
 * Called whenever the player enters a map. If the destination is a
 * safe village, we anchor the respawn point there.
 */
export async function markSafeMapIfVillage(mapId: string): Promise<void> {
    const coords = SAFE_MAPS[mapId];
    if (!coords) return;
    await preferences.set(KEYS.lastSafeMapId, mapId);
    await preferences.set(KEYS.lastSafeSpawnX, String(coords.x));
    await preferences.set(KEYS.lastSafeSpawnY, String(coords.y));
}

/**
 * onDead handler — revives the player at the last safe village.
 * Party roster is preserved (no permadeath; kid audience). HP is
 * reset to the player's max via `player.hp = player.param.maxhp`.
 */
export async function respawnAtLastSafeMap(player: RpgPlayer): Promise<void> {
    const [mapId, xStr, yStr] = await Promise.all([
        preferences.get(KEYS.lastSafeMapId),
        preferences.get(KEYS.lastSafeSpawnX),
        preferences.get(KEYS.lastSafeSpawnY),
    ]);
    const target = mapId && xStr && yStr
        ? { mapId, x: Number(xStr), y: Number(yStr) }
        : DEFAULT_RESPAWN;

    await playDialog(player, 'game_over_revive');

    // Restore to full HP. RpgPlayer's max hp lives on the param bag;
    // reading it back avoids hardcoding a player-class-dependent value.
    const maxHp = (player as unknown as { param?: { maxhp?: number } }).param?.maxhp;
    if (typeof maxHp === 'number' && maxHp > 0) {
        (player as unknown as { hp: number }).hp = maxHp;
    }

    await player.changeMap(target.mapId, { x: target.x, y: target.y });
    await preferences.set(KEYS.currentMapId, target.mapId);
}
