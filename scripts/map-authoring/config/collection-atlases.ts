import type { PaletteEntry } from "../lib/types";

export interface CollectionAtlasSpec {
    source: string;
    output: string;
    localIds: readonly number[];
}

export const COLLECTION_ATLAS_SPECS = [
    {
        source: "seasons/Objects_Trees_Seasons",
        output: "generated/Atlas_Seasons_Objects_Trees_Seasons",
        localIds: [0, 1, 2, 14, 16, 32, 52, 82, 113],
    },
    {
        source: "seasons/Objects_Buildings_Seasons",
        output: "generated/Atlas_Seasons_Objects_Buildings_Seasons",
        localIds: [58, 271, 282],
    },
    {
        source: "seasons/Objects_Rocks_Seasons",
        output: "generated/Atlas_Seasons_Objects_Rocks_Seasons",
        localIds: [20, 42, 65],
    },
    {
        source: "snow/Objects_Buildings_Snow",
        output: "generated/Atlas_Snow_Objects_Buildings_Snow",
        localIds: [293, 341, 358],
    },
    {
        source: "snow/Objects_Props_Snow",
        output: "generated/Atlas_Snow_Objects_Props_Snow",
        localIds: [414],
    },
    {
        source: "snow/Objects_Rocks_Snow",
        output: "generated/Atlas_Snow_Objects_Rocks_Snow",
        localIds: [88, 95],
    },
    {
        source: "snow/Objects_Trees_Snow",
        output: "generated/Atlas_Snow_Objects_Trees_Snow",
        localIds: [5, 7, 21, 30],
    },
] as const satisfies readonly CollectionAtlasSpec[];

export type CollectionAtlasSource = (typeof COLLECTION_ATLAS_SPECS)[number]["source"];

export function collectionAtlasEntry(
    source: CollectionAtlasSource,
    sourceLocalId: number,
): Pick<PaletteEntry, "tsx" | "local_id"> {
    const spec = collectionAtlasSpec(source);
    const localId = spec.localIds.indexOf(sourceLocalId);
    if (localId === -1) {
        throw new Error(
            `collection atlas "${source}" does not include source local_id ${sourceLocalId}`,
        );
    }
    return { tsx: spec.output, local_id: localId };
}

export function collectionAtlasTileset(source: CollectionAtlasSource): string {
    return collectionAtlasSpec(source).output;
}

export function collectionAtlasSourceLocalId(output: string, localId: number): number | null {
    const spec = COLLECTION_ATLAS_SPECS.find((candidate) => candidate.output === output);
    return spec?.localIds[localId] ?? null;
}

function collectionAtlasSpec(source: CollectionAtlasSource): CollectionAtlasSpec {
    const spec = COLLECTION_ATLAS_SPECS.find((candidate) => candidate.source === source);
    if (!spec) throw new Error(`unknown collection atlas source "${source}"`);
    return spec;
}
