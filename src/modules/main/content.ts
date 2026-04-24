import worldRaw from "../../content/generated/world.json";
import type { DialogNode } from "../../content/schema/dialog";
import type { Journey } from "../../content/schema/journey";

type Species = {
    id: string;
    learnset: { level: number; move_id: string }[];
};

/**
 * Narrow runtime type for the fields content.ts actually reads from world.json.
 * The full World shape lives in src/content/schema/world.ts — we import only
 * what we need here to keep the dependency surface tight.
 */
type NpcRegistryEntry = {
    id: string;
    display_name: string;
    home_region?: string;
    role?: string;
    graphic?: string;
};

type ContentWorld = {
    dialog: DialogNode[];
    journey: Journey;
    start_region_id: string;
    species: Species[];
    npcs?: NpcRegistryEntry[];
};

/**
 * Guard the minimum required fields so build-output divergence surfaces as
 * a loud startup error rather than a silent undefined at call sites (CR #3107839129).
 * The cast itself is safe — world.json is produced by build-spine.mjs which
 * validates the full schema before writing — but we verify the critical fields
 * are present so a stale or hand-edited artifact doesn't silently break runtime.
 */
function assertContentWorld(raw: unknown): ContentWorld {
    if (
        raw == null ||
        typeof raw !== "object" ||
        !Array.isArray((raw as Record<string, unknown>).dialog) ||
        !Array.isArray((raw as Record<string, unknown>).species) ||
        typeof (raw as Record<string, unknown>).start_region_id !== "string" ||
        (raw as Record<string, unknown>).journey == null
    ) {
        throw new Error(
            "[content] world.json is missing required fields — run `pnpm build-spine` to regenerate",
        );
    }
    return raw as unknown as ContentWorld;
}

const world = assertContentWorld(worldRaw);

export function getDialogById(id: string): DialogNode | undefined {
    return world.dialog.find((d) => d.id === id);
}

/**
 * All dialog states authored for the same NPC, in authoring order.
 * Returns [] for unknown or npc-less (system) dialogs. The selector
 * in dialog.ts uses this to pick the best-matching state when a
 * dossier-authored NPC has multiple reactive variants.
 */
export function getDialogsForNpc(npcId: string): DialogNode[] {
    return world.dialog.filter((d) => d.npc_id === npcId);
}

/**
 * Display name for a dossier NPC. Returns null for unknown ids or for
 * system dialogs whose dialog nodes have `npc_id: null`. Used by
 * playDialog to pass DialogOptions.speaker so the UI surface renders
 * "Selby: ..." instead of just the line.
 */
const NPC_REGISTRY = new Map<string, NpcRegistryEntry>(
    (world.npcs ?? []).map((npc) => [npc.id, npc]),
);

export function getNpcDisplayName(npcId: string | null): string | null {
    if (!npcId) return null;
    return NPC_REGISTRY.get(npcId)?.display_name ?? null;
}

export function getStartMapId(): string {
    return world.start_region_id;
}

export function getJourneyBeats() {
    return world.journey.beats;
}

/**
 * Move IDs a species learns at a specific level (usually 0 or 1 per
 * creature per level). Used by the victory sequence to emit a
 * "learned X" toast when a level boundary matches a learnset entry.
 */
export function movesLearnedAtLevel(speciesId: string, level: number): string[] {
    const species = world.species.find((s) => s.id === speciesId);
    if (!species) return [];
    return species.learnset.filter((l) => l.level === level).map((l) => l.move_id);
}
