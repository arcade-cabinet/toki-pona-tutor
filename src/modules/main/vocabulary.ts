import cluesRaw from "../../content/clues.json";
import { recordClue } from "../../platform/persistence/queries";

type ClueEntry = {
    id: string;
    label: string;
    summary: string;
    category: string;
    icon: string;
};

const clues = cluesRaw as ClueEntry[];
const clueSet = new Set(clues.map((entry) => entry.id));
const clueMap = new Map<string, ClueEntry>(clues.map((entry) => [entry.id, entry]));

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
