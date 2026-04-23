import type { RpgPlayer } from "@rpgjs/server";
import {
    listMasteredWords,
    getWordSightings,
    getSentenceLogCount,
    listSentenceLog,
} from "../../platform/persistence/queries";
import { clueCount, clueLabel } from "./vocabulary";
import { VOCABULARY_SCREEN_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { glyphForDisplay, type GlyphOptions } from "../../styles/sitelen-glyph";
import { exportDump } from "./sentence-log";

/**
 * Shows clue progress, then pages through the discovered list with
 * sighting counts. The file name is kept for compatibility while the
 * old language-learning layer is removed.
 */
export async function showVocabulary(player: RpgPlayer): Promise<void> {
    const mastered = await listMasteredWords(VOCABULARY_SCREEN_CONFIG.masteryThreshold);
    const total = clueCount();
    await player.showText(formatVocabularySummary(mastered.length, total));

    if (mastered.length === 0) return;

    for (let page = 0; page < mastered.length; page += VOCABULARY_SCREEN_CONFIG.pageSize) {
        const chunk = mastered.slice(page, page + VOCABULARY_SCREEN_CONFIG.pageSize);
        const lines: string[] = [];
        for (const word of chunk) {
            const sightings = await getWordSightings(word);
            lines.push(formatVocabularyEntry(word, sightings));
        }
        await player.showText(lines.join("\n"));
    }
}

export async function showSentenceLog(player: RpgPlayer): Promise<void> {
    const count = await getSentenceLogCount();
    const summary = formatSentenceLogSummary(count);

    if (count === 0) {
        await player.showText(`${summary}\n${VOCABULARY_SCREEN_CONFIG.sentenceLogEmptyText}`);
        return;
    }

    const entries = await listSentenceLog(VOCABULARY_SCREEN_CONFIG.pageSize);
    await player.showText(`${summary}\n${exportDump(entries)}`);
}

export function formatVocabularySummary(mastered: number, total: number): string {
    return formatGameplayTemplate(VOCABULARY_SCREEN_CONFIG.summaryTemplate, { mastered, total });
}

export function formatVocabularyEntry(word: string, sightings: number): string {
    return formatGameplayTemplate(VOCABULARY_SCREEN_CONFIG.entryTemplate, {
        word: clueLabel(word),
        sightings,
    });
}

export function formatVocabularyRowLabel(word: string, opts: GlyphOptions = {}): string {
    return formatGameplayTemplate(VOCABULARY_SCREEN_CONFIG.rowLabelTemplate, {
        word: clueLabel(word),
        glyph: glyphForDisplay(word, opts),
    });
}

export function formatVocabularyGlyphCard(
    word: string,
    sightings: number,
    opts: GlyphOptions = {},
): string {
    return formatGameplayTemplate(VOCABULARY_SCREEN_CONFIG.glyphCardTemplate, {
        word: clueLabel(word),
        sightings,
        glyph: glyphForDisplay(word, opts),
    });
}

export function formatSentenceLogSummary(count: number): string {
    return formatGameplayTemplate(VOCABULARY_SCREEN_CONFIG.sentenceLogSummaryTemplate, { count });
}
