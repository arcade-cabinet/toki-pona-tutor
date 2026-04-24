/**
 * Merge per-region NPC dossiers (src/content/regions/<id>/npcs/*.json) into a
 * MapSpec's Objects layer. The dossier `appearances` array declares which
 * region(s) each NPC walks into and at what tile coordinates; this merger
 * injects any appearance whose `region === mapId` into the spec's Objects
 * array as an NPC marker, unless the spec already has a hand-authored NPC
 * with the same id (hand-authored wins).
 *
 * The dossier's primary state id (first dialog state) is used as the NPC
 * marker's `dialog_id`, matching the legacy convention used by
 * src/modules/main/event.ts and the engine's NPC handler.
 *
 * Requires-flag appearances attach a `required_flag` custom property so the
 * runtime can gate visibility (the existing Warp handler already supports
 * this shape; NPC handling will be extended separately).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { MapSpec, ObjectMarker } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const worktreeRoot = resolve(__dirname, "..", "..", "..");

type NpcDossier = {
    id: string;
    display_name?: string;
    home_region?: string;
    role?: string;
    appearances: Array<{
        region: string;
        spawn?: [number, number];
        default?: boolean;
        requires_flag?: string;
    }>;
    dialog_states: Array<{ id: string }>;
};

function loadDossiersForRegion(mapId: string): NpcDossier[] {
    const dossiersDir = join(worktreeRoot, "src", "content", "regions");
    if (!existsSync(dossiersDir)) return [];

    const out: NpcDossier[] = [];
    for (const regionName of readdirSync(dossiersDir)) {
        const npcsDir = join(dossiersDir, regionName, "npcs");
        if (!existsSync(npcsDir)) continue;
        for (const file of readdirSync(npcsDir).filter((f) => f.endsWith(".json"))) {
            const dossier = JSON.parse(readFileSync(join(npcsDir, file), "utf8")) as NpcDossier;
            // Does this NPC appear in the target map?
            const matches = (dossier.appearances ?? []).filter((a) => a.region === mapId);
            if (matches.length > 0) out.push(dossier);
        }
    }
    return out;
}

/**
 * Merge dossier NPC appearances into a MapSpec's Objects layer. Hand-authored
 * NPCs with the same id always win; dossier-sourced NPCs fill whatever the
 * hand-authored spec omitted.
 */
export function mergeDossierNpcsIntoSpec(spec: MapSpec): MapSpec {
    const mapId = spec.id;
    const dossiers = loadDossiersForRegion(mapId);
    if (dossiers.length === 0) return spec;

    const existingObjects = spec.layers.Objects ?? [];
    const handAuthoredNpcIds = new Set(
        existingObjects
            .filter((o): o is Extract<ObjectMarker, { type: "NPC" }> => o.type === "NPC")
            .map((o) => String(o.props.id)),
    );

    const injected: ObjectMarker[] = [];
    for (const dossier of dossiers) {
        if (handAuthoredNpcIds.has(dossier.id)) continue;
        const appearance = dossier.appearances.find((a) => a.region === mapId);
        if (!appearance?.spawn) continue;
        const primaryStateId = dossier.dialog_states?.[0]?.id;
        if (!primaryStateId) continue;

        const props: { id: string; dialog_id: string } & Record<string, string> = {
            id: dossier.id,
            dialog_id: primaryStateId,
        };
        if (appearance.requires_flag) {
            props.required_flag = appearance.requires_flag;
        }

        injected.push({
            type: "NPC",
            name: `npc-${dossier.id}`,
            at: appearance.spawn,
            props,
        } as ObjectMarker);
    }

    if (injected.length === 0) return spec;

    return {
        ...spec,
        layers: {
            ...spec.layers,
            Objects: [...existingObjects, ...injected],
        },
    };
}
