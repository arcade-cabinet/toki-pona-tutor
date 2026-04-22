import worldRaw from "../../content/generated/world.json";
import { BESTIARY_PANEL_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { bestiaryTier, progressRatio, type BestiaryState, type BestiaryTier } from "./bestiary";

type SpeciesEntry = {
    id: string;
    type?: string;
    description?: {
        en?: string;
        tp?: string;
    };
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
    const speciesIds = world.species.map((species) => species.id);
    const caught = Math.round(progressRatio(state, speciesIds) * speciesIds.length);
    return {
        title: formatGameplayTemplate(BESTIARY_PANEL_CONFIG.titleTemplate, {
            caught,
            total: speciesIds.length,
        }),
        rows: world.species.map((species, index) => {
            const tier = bestiaryTier(state, species.id);
            const label =
                tier === "unknown"
                    ? formatGameplayTemplate(BESTIARY_PANEL_CONFIG.unknownLabelTemplate, {
                          index: index + 1,
                      })
                    : prettifyId(species.id);
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
            return entry;
        }),
    };
}

function bestiaryMeta(tier: BestiaryTier, type: string | undefined): string {
    const typeLabel = type ?? BESTIARY_PANEL_CONFIG.unknownTypeLabel;
    if (tier === "caught") {
        return formatGameplayTemplate(BESTIARY_PANEL_CONFIG.caughtMetaTemplate, {
            type: typeLabel,
        });
    }
    if (tier === "seen") {
        return formatGameplayTemplate(BESTIARY_PANEL_CONFIG.seenMetaTemplate, { type: typeLabel });
    }
    return BESTIARY_PANEL_CONFIG.unknownMeta;
}

function prettifyId(id: string): string {
    return id.replace(/_/g, " ");
}

function bestiaryDescription(tier: BestiaryTier, species: SpeciesEntry): string | undefined {
    if (tier === "unknown") return undefined;
    return species.description?.tp?.trim() || species.description?.en?.trim() || undefined;
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
