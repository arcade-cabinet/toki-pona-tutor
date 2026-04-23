import worldRaw from "./generated/world.json";
import { COMBAT_TYPE_LABELS } from "./gameplay";

export type RuntimeName = {
    en?: string;
    tp?: string;
};

type RuntimeNamedEntry = {
    id: string;
    name?: RuntimeName;
};

type RuntimeSpeciesEntry = RuntimeNamedEntry & {
    type?: string;
    description?: RuntimeName;
};

type RuntimeWorld = {
    species?: RuntimeSpeciesEntry[];
    moves?: RuntimeNamedEntry[];
    items?: RuntimeNamedEntry[];
};

const world = worldRaw as RuntimeWorld;
const speciesIndex = new Map((world.species ?? []).map((entry) => [entry.id, entry]));
const moveIndex = new Map((world.moves ?? []).map((entry) => [entry.id, entry]));
const itemIndex = new Map((world.items ?? []).map((entry) => [entry.id, entry]));

export function resolveRuntimeName(name: RuntimeName | undefined): string | null {
    const candidate = name?.en?.trim() || name?.tp?.trim();
    return candidate || null;
}

export function prettifyRuntimeId(id: string): string {
    return id.replace(/[_-]+/g, " ");
}

export function typeLabel(typeId: string | null | undefined): string {
    if (!typeId) return "unknown";
    return COMBAT_TYPE_LABELS[typeId as keyof typeof COMBAT_TYPE_LABELS] ?? prettifyRuntimeId(typeId);
}

export function speciesLabel(speciesId: string): string {
    return resolveRuntimeName(speciesIndex.get(speciesId)?.name) ?? prettifyRuntimeId(speciesId);
}

export function speciesTypeLabel(speciesId: string): string {
    return typeLabel(speciesIndex.get(speciesId)?.type);
}

export function speciesDescription(speciesId: string): string | null {
    return resolveRuntimeName(speciesIndex.get(speciesId)?.description);
}

export function moveLabel(moveId: string): string {
    return resolveRuntimeName(moveIndex.get(moveId)?.name) ?? prettifyRuntimeId(moveId);
}

export function itemLabel(itemId: string): string {
    return resolveRuntimeName(itemIndex.get(itemId)?.name) ?? prettifyRuntimeId(itemId);
}
