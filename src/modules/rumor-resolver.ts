/**
 * Rumor resolver — maps a rumor-dialog template to a real unvisited
 * chunk in the player's seed, with direction + distance tokens.
 *
 * Per docs/DIALOG_POOL.md § Rumor system and docs/DESIGN.md § Forward pulls.
 *
 * Walking in the hinted direction finds the described thing eventually.
 * Rumors expire after ~30 in-game days if unchased.
 */

import type { ChunkCoord } from "./world-generator";

export type RumorDirection =
    | "north" | "south" | "east" | "west"
    | "northeast" | "northwest" | "southeast" | "southwest";

export type DistanceHint = "close" | "far" | "days_away";

export type Rumor = {
    templateId: string;
    targetChunk: ChunkCoord;
    direction: RumorDirection;
    distanceHint: DistanceHint;
    issuedDay: number;
    expiresDay: number;
};

/**
 * Compute the 8-point compass direction from `from` to `to`.
 * Positive y = north in the chunk grid.
 */
export function compassDirection(from: ChunkCoord, to: ChunkCoord): RumorDirection {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Cardinal if one axis dominates by 2:1 or more
    if (absDx >= absDy * 2) return dx > 0 ? "east" : "west";
    if (absDy >= absDx * 2) return dy > 0 ? "north" : "south";

    // Diagonal
    const ns = dy > 0 ? "north" : "south";
    const ew = dx > 0 ? "east" : "west";
    return `${ns}${ew}` as RumorDirection;
}

/**
 * Map Chebyshev distance to a prose distance hint.
 */
export function distanceHint(chebyshevDist: number): DistanceHint {
    if (chebyshevDist <= 3) return "close";
    if (chebyshevDist <= 8) return "far";
    return "days_away";
}

/**
 * Given a rumor-line template id + the player's current chunk, return
 * a matching unvisited chunk in the player's seed world and compose
 * direction + distance tokens for the line.
 *
 * Full implementation requires chunk-store visit queries (Phase 9 wiring).
 * Returns a rumor pointing to a deterministic candidate based on seed + playerCoord.
 */
export function resolveRumor(
    seed: number,
    playerCoord: ChunkCoord,
    templateId: string,
    currentDay: number,
): Rumor {
    // Deterministic candidate: pick a chunk 3-5 steps away in a seeded direction
    const h = ((seed >>> 0) ^ (playerCoord.x * 1000003) ^ (playerCoord.y * 999983) ^ templateId.length) >>> 0;
    const offsets = [3, 4, 5];
    const dist = offsets[h % offsets.length]!;
    const angle = (h * 137) % 360;
    const rad = (angle * Math.PI) / 180;
    const targetX = playerCoord.x + Math.round(dist * Math.cos(rad));
    const targetY = playerCoord.y + Math.round(dist * Math.sin(rad));
    const targetChunk = { x: targetX, y: targetY };

    return {
        templateId,
        targetChunk,
        direction: compassDirection(playerCoord, targetChunk),
        distanceHint: distanceHint(dist),
        issuedDay: currentDay,
        expiresDay: currentDay + 30,
    };
}

/**
 * Remove rumors that have passed their expiry day.
 */
export function expireRumors(rumors: Rumor[], currentDay: number): Rumor[] {
    return rumors.filter((r) => r.expiresDay > currentDay);
}
