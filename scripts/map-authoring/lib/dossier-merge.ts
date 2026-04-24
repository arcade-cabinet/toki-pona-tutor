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
 *
 * T69: this merger also emits Sign objects from src/content/regions/<id>/signs.json
 * so signs surface as editable Tiled objects next to the NPC markers. Runtime
 * still reads signs from the compiled world.json signs[] array — the Tiled
 * emission is for authoring visibility only (Tiled editor, preview PNG).
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
    graphic?: string;
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

type SignDoc = {
    region: string;
    signs: Array<{
        at: [number, number];
        title: string;
        body: { en: string };
    }>;
};

function loadSignsForRegion(mapId: string): SignDoc["signs"] {
    const signsPath = join(worktreeRoot, "src", "content", "regions", mapId, "signs.json");
    if (!existsSync(signsPath)) return [];
    const doc = JSON.parse(readFileSync(signsPath, "utf8")) as SignDoc;
    if (doc.region !== mapId) return [];
    return doc.signs ?? [];
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
        if (dossier.graphic) {
            props.graphic = dossier.graphic;
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

/**
 * Merge dossier signs into a MapSpec's Objects layer. Each sign in the
 * region's signs.json becomes a Sign marker at its tile coordinates. Name
 * is `sign-<x>-<y>` so it's stable and collision-resistant with any
 * hand-authored Sign markers that use `sign_<x>_<y>` (the runtime id from
 * server.ts).
 *
 * Runtime still reads signs directly from world.signs[] — this emission
 * is for Tiled authoring visibility only (so signs appear alongside NPCs
 * and warps when editing a map).
 */
export function mergeDossierSignsIntoSpec(spec: MapSpec): MapSpec {
    const mapId = spec.id;
    const signs = loadSignsForRegion(mapId);
    if (signs.length === 0) return spec;

    const existingObjects = spec.layers.Objects ?? [];
    const existingSignCoords = new Set(
        existingObjects
            .filter((o): o is Extract<ObjectMarker, { type: "Sign" }> => o.type === "Sign")
            .map((o) => `${o.at[0]},${o.at[1]}`),
    );

    const injected: ObjectMarker[] = [];
    for (const sign of signs) {
        const key = `${sign.at[0]},${sign.at[1]}`;
        if (existingSignCoords.has(key)) continue;
        injected.push({
            type: "Sign",
            name: `sign-${sign.at[0]}-${sign.at[1]}`,
            at: sign.at,
            props: {
                text: sign.body.en,
                title: sign.title,
            },
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
