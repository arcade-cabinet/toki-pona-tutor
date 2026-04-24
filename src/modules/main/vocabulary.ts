import { recordClue } from "../../platform/persistence/queries";

type ClueEntry = {
    id: string;
    label: string;
    summary: string;
    category: string;
    icon: string;
};

// v1 clues.json retired in T109. The clue/bestiary system is kept
// structurally for v2 but the authored list is empty until the v2
// bestiary + world-discovery system lands.
const clues: ClueEntry[] = [];
const clueSet = new Set<string>();
const clueMap = new Map<string, ClueEntry>();

export function tokenize(text: string): string[] {
    const cleaned = text
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\s'-]+/gu, " ")
        .split(/\s+/)
        .filter(Boolean);
    return cleaned.filter((token) => clueSet.has(token));
}

export function lookupClue(id: string): ClueEntry | undefined {
    return clueMap.get(id);
}

export function clueLabel(id: string): string {
    return clueMap.get(id)?.label ?? id.replace(/[-_:]+/g, " ");
}

export function clueIcon(id: string): string {
    return clueMap.get(id)?.icon ?? "•";
}

export async function observeClueText(text: string): Promise<void> {
    const tokens = tokenize(text);
    for (const token of new Set(tokens)) {
        await recordClue(token);
    }
}

export function clueCount(): number {
    return clues.length;
}

export const dictionarySize = clueCount;
export const lookupWord = lookupClue;
export const observeTpLine = observeClueText;
