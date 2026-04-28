import worldRaw from "../../content/generated/world.json";

type TranslatableName = {
    en?: string;
    tp?: string;
};

type ItemEntry = {
    id: string;
    name?: TranslatableName;
    kind?: string;
    power?: number;
};

type ContentWorld = {
    items: ItemEntry[];
};

export type HealingItem = {
    id: string;
    label: string;
    amount: number;
};

export type HealResult = {
    currentHp: number;
    maxHp: number;
    nextHp: number;
    healed: number;
};

function assertContentWorld(raw: unknown): ContentWorld {
    if (
        raw == null ||
        typeof raw !== "object" ||
        !Array.isArray((raw as Record<string, unknown>).items)
    ) {
        throw new Error("[healing-items] world.json is missing item metadata");
    }
    return raw as ContentWorld;
}

const world = assertContentWorld(worldRaw);
const itemIndex = new Map(world.items.map((item) => [item.id, item]));

export function healingItem(itemId: string): HealingItem | null {
    const item = itemIndex.get(itemId);
    if (!item || item.kind !== "potion") return null;
    const power = Number(item.power ?? 0);
    const amount = Number.isFinite(power) ? Math.max(0, Math.round(power)) : 0;
    if (amount <= 0) return null;
    return {
        id: item.id,
        label: resolveName(item.name) ?? item.id.replace(/_/g, " "),
        amount,
    };
}

export function listHealingItems(): HealingItem[] {
    return world.items
        .map((item) => healingItem(item.id))
        .filter((item): item is HealingItem => item !== null);
}

export function applyHeal(input: { currentHp: number; maxHp: number }, amount: number): HealResult {
    const rawMaxHp = Number(input.maxHp);
    const rawCurrentHp = Number(input.currentHp);
    const rawAmount = Number(amount);
    const maxHp = Number.isFinite(rawMaxHp) ? Math.max(1, Math.round(rawMaxHp)) : 1;
    const currentHp = Number.isFinite(rawCurrentHp)
        ? Math.max(0, Math.min(maxHp, Math.round(rawCurrentHp)))
        : maxHp;
    const healAmount = Number.isFinite(rawAmount) ? Math.max(0, Math.round(rawAmount)) : 0;
    const nextHp = Math.max(0, Math.min(maxHp, currentHp + healAmount));
    return {
        currentHp,
        maxHp,
        nextHp,
        healed: nextHp - currentHp,
    };
}

function resolveName(name: TranslatableName | undefined): string | null {
    const candidate = name?.en?.trim() || name?.tp?.trim();
    return candidate || null;
}
