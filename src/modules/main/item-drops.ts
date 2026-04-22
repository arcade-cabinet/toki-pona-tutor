import {
    ITEM_DROP_FALLBACK_BY_TYPE,
    ITEM_DROP_TIER_DEFAULTS,
    NOTIFICATION_CONFIG,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

export type SpeciesItemDrop = {
    item_id: string;
    chance: number;
    count?: number;
};

export type SpeciesDropSource = {
    id?: string;
    type?: string;
    sprite?: {
        tier?: "common" | "uncommon" | "legendary";
    };
    item_drop?: SpeciesItemDrop | null;
};

export type RolledItemDrop = {
    itemId: string;
    count: number;
};

export function rollSpeciesItemDrop(
    source: SpeciesDropSource,
    rng: () => number = Math.random,
): RolledItemDrop | null {
    const drop = resolveSpeciesItemDrop(source);
    if (!drop) return null;

    const chance = Number(drop.chance);
    if (!Number.isFinite(chance) || chance <= 0) return null;
    if (rng() >= Math.min(1, chance)) return null;

    const rawCount = Number(drop.count ?? 1);
    const count = Number.isFinite(rawCount) ? Math.max(1, Math.round(rawCount)) : 1;
    return {
        itemId: drop.item_id,
        count,
    };
}

export function resolveSpeciesItemDrop(source: SpeciesDropSource): SpeciesItemDrop | null {
    if (source.item_drop) return source.item_drop;

    const itemId = fallbackItemForType(source.type);
    if (!itemId) return null;

    const tier = source.sprite?.tier ?? "common";
    const fallback = ITEM_DROP_TIER_DEFAULTS[tier];
    return { item_id: itemId, chance: fallback.chance, count: fallback.count };
}

export function formatItemDrop(drop: RolledItemDrop): string {
    return formatGameplayTemplate(NOTIFICATION_CONFIG.itemDrop.template, {
        item: drop.itemId.replace(/_/g, " "),
        count: drop.count,
    });
}

function fallbackItemForType(type: string | undefined): string | null {
    if (!type) return null;
    return ITEM_DROP_FALLBACK_BY_TYPE[type] ?? null;
}
