import worldRaw from "../../content/generated/world.json";
import { BESTIARY_PANEL_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import {
    resolveRuntimeName,
    speciesLabel,
    typeLabel,
    type RuntimeName,
} from "../../content/runtime-labels";
import { bestiaryTier, type BestiaryState, type BestiaryTier } from "./bestiary";

type SpeciesEntry = {
    id: string;
    name?: RuntimeName;
    type?: string;
    description?: RuntimeName;
};

type ContentWorld = {
    species: SpeciesEntry[];
};

export type BestiaryPanelEntry = {
    speciesId: string;
    tier: BestiaryTier;
    label: string;
    meta: string;
    testId: string;
    description?: string;
    readText?: string;
};

export type BestiaryPanel = {
    title: string;
    rows: BestiaryPanelEntry[];
};

function assertContentWorld(raw: unknown): ContentWorld {
    if (
        raw == null ||
        typeof raw !== "object" ||
        !Array.isArray((raw as Record<string, unknown>).species)
    ) {
        throw new Error("[bestiary-panel] world.json is missing species metadata");
    }
    return raw as ContentWorld;
}

const world = assertContentWorld(worldRaw);

export function buildBestiaryPanel(state: BestiaryState): BestiaryPanel {
    const rows: BestiaryPanelEntry[] = [];
    for (const species of world.species) {
        const tier = bestiaryTier(state, species.id);
        if (tier === "unknown") continue;
        const label = speciesLabel(species.id);
        const description = bestiaryDescription(tier, species);
        const readText = bestiaryReadText(tier, label, description);
        const entry: BestiaryPanelEntry = {
            speciesId: species.id,
            tier,
            label,
            meta: bestiaryMeta(tier, species.type),
            testId: `bestiary-entry-${species.id}`,
        };
        if (description) entry.description = description;
        if (readText) entry.readText = readText;
        rows.push(entry);
    }
    const caught = rows.filter((r) => r.tier === "caught").length;
    return {
        title: formatGameplayTemplate(BESTIARY_PANEL_CONFIG.titleTemplate, { caught }),
        rows,
    };
}

function bestiaryMeta(tier: BestiaryTier, type: string | undefined): string {
    const label = type ? typeLabel(type) : BESTIARY_PANEL_CONFIG.unknownTypeLabel;
    if (tier === "caught") {
        return formatGameplayTemplate(BESTIARY_PANEL_CONFIG.caughtMetaTemplate, {
            type: label,
        });
    }
    if (tier === "seen") {
        return formatGameplayTemplate(BESTIARY_PANEL_CONFIG.seenMetaTemplate, { type: label });
    }
    return BESTIARY_PANEL_CONFIG.unknownMeta;
}

function bestiaryDescription(tier: BestiaryTier, species: SpeciesEntry): string | undefined {
    if (tier === "unknown") return undefined;
    return resolveRuntimeName(species.description) ?? undefined;
}

function bestiaryReadText(
    tier: BestiaryTier,
    label: string,
    description: string | undefined,
): string | undefined {
    if (tier === "unknown") return undefined;
    return formatGameplayTemplate(BESTIARY_PANEL_CONFIG.descriptionTextTemplate, {
        label,
        description: description || BESTIARY_PANEL_CONFIG.missingDescriptionText,
    });
}
