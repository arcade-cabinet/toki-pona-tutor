/**
 * Rumor resolver — maps a rumor-dialog template to a real unvisited
 * chunk in the player's seed, with direction + distance tokens.
 *
 * Per docs/DIALOG_POOL.md § Rumor system and docs/DESIGN.md § Forward
 * pulls. Unimplemented; Phase 6 populates.
 *
 * Walking in the hinted direction finds the described thing eventually.
 * Rumors expire after ~30 in-game days if unchased.
 */

import type { ChunkCoord } from "./world-generator";

export type Rumor = {
    templateId: string;
    targetChunk: ChunkCoord;
    direction: "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest";
    distanceHint: "close" | "far" | "days_away";
    issuedDay: number;
    expiresDay: number;
};

/**
 * Given a rumor-line template id + the player's current chunk, return
 * a matching unvisited chunk in the player's seed world and compose
 * direction + distance tokens for the line.
 */
export function resolveRumor(
    _seed: number,
    _playerCoord: ChunkCoord,
    _templateId: string,
    _currentDay: number,
): Rumor {
    throw new Error("rumor-resolver.resolveRumor unimplemented (Phase 6)");
}

/**
 * Drop expired rumors from the player's journal.
 */
export function expireRumors(_rumors: Rumor[], _currentDay: number): Rumor[] {
    throw new Error("rumor-resolver.expireRumors unimplemented (Phase 6)");
}
