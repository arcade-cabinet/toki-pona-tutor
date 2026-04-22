import { MAXHP, type RpgPlayer } from "@rpgjs/server";

export type PlayerHpSnapshot = {
    currentHp: number;
    maxHp: number;
};

export function leadHpSnapshot(player: RpgPlayer): PlayerHpSnapshot | null {
    const currentHp = Number((player as unknown as { hp?: unknown }).hp);
    const maxHp = Number(
        (player as unknown as { param?: Record<string | number, unknown> }).param?.[MAXHP] ??
            currentHp,
    );
    if (!Number.isFinite(currentHp) || !Number.isFinite(maxHp) || maxHp <= 0) return null;
    return {
        currentHp,
        maxHp,
    };
}

export function setPlayerHp(player: RpgPlayer, hp: number): void {
    const currentMax = Number(
        (player as unknown as { param?: Record<string | number, unknown> }).param?.[MAXHP] ?? hp,
    );
    const maxHp = Number.isFinite(currentMax) && currentMax > 0 ? currentMax : hp;
    (player as unknown as { hp: number }).hp = Math.max(0, Math.min(maxHp, Math.round(hp)));
}
