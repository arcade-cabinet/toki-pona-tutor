/**
 * Personal dictionary export — T8-06.
 *
 * At end-of-playthrough (or on-demand from the pause menu), the player
 * can export a shareable record of every TP word they mastered. Two
 * output formats:
 *
 * 1. **Text card** — a plaintext summary suitable for copying into
 *    chat / pasting into a journal. Sections: total words, most-sighted
 *    top-20, recently-learned (last 7 days).
 * 2. **SVG card** — a 400×600 graphic with the same info, styled
 *    for social-share / print. Deterministic layout: word cloud
 *    weighted by sightings count.
 *
 * Both functions are pure — they take a snapshot + the player's name
 * and return a string. No filesystem, no DOM, no canvas. The runtime
 * is responsible for saving / copying / downloading the output.
 */

import type { RpgPlayer } from "@rpgjs/server";
import {
    DICTIONARY_EXPORT_CONFIG,
    FINAL_BOSS_CONFIG,
    VOCABULARY_SCREEN_CONFIG,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { getFlag, listMasteredWordRecords } from "../../platform/persistence/queries";

export const DICTIONARY_EXPORT_EVENT = "poki:dictionary-export";

export interface MasteredWord {
    tp: string;
    sightings: number;
    mastered_at: string; // ISO timestamp
}

export interface ExportSnapshot {
    playerName: string;
    words: MasteredWord[];
    journeyCleared: boolean;
    ngPlusCount: number;
    exportedAt: string; // ISO
}

export interface DictionaryExportPayload {
    textCard: string;
    svgCard: string;
    filename: string;
}

/**
 * Render a compact plaintext card. Always deterministic: same snapshot
 * produces byte-identical output, so callers can diff exports across
 * playthroughs.
 *
 * @example
 * exportTextCard({
 *   playerName: 'Sam',
 *   words: [{ tp: 'soweli', sightings: 12, mastered_at: '2026-04-20T00:00:00Z' }],
 *   journeyCleared: true,
 *   ngPlusCount: 0,
 *   exportedAt: '2026-04-20T12:00:00Z',
 * })
 * // → (multi-line string with the player's stats)
 */
export function exportTextCard(snap: ExportSnapshot): string {
    const config = DICTIONARY_EXPORT_CONFIG.textCard;
    const lines: string[] = [];

    lines.push(config.header);
    lines.push(formatGameplayTemplate(config.playerTemplate, { player: snap.playerName }));
    lines.push(`  ${textJourneyBadge(snap)}`);
    lines.push(formatGameplayTemplate(config.exportedAtTemplate, { date: exportDate(snap) }));
    lines.push(formatGameplayTemplate(config.wordCountTemplate, { count: snap.words.length }));
    lines.push("");

    if (snap.words.length === 0) {
        lines.push(config.emptyWords);
        return lines.join("\n");
    }

    // Top-20 by sightings, tie-break by mastered_at asc (older first so
    // the player's journey order shows through).
    const topSighted = [...snap.words]
        .sort((a, b) => {
            if (b.sightings !== a.sightings) return b.sightings - a.sightings;
            return a.mastered_at.localeCompare(b.mastered_at);
        })
        .slice(0, config.topWordsLimit);

    lines.push(config.topWordsHeader);
    for (const w of topSighted) {
        lines.push(
            formatGameplayTemplate(config.wordRowTemplate, {
                word: w.tp.padEnd(config.wordColumnWidth),
                marks: config.sightingMark.repeat(Math.min(config.sightingMarkCap, w.sightings)),
            }),
        );
    }

    return lines.join("\n");
}

/**
 * Render an SVG share-card. 400×600 px. Minimal — a title block, the
 * player's name, the total word count as a big number, and a 6×4 grid
 * of the 24 most-sighted words. Colors are parchment-on-dark matching
 * the game's theme.
 *
 * Pure: no DOM, no canvas. Returns the full SVG source.
 */
export function exportSvgCard(snap: ExportSnapshot): string {
    const config = DICTIONARY_EXPORT_CONFIG.svgCard;
    const top = [...snap.words]
        .sort((a, b) => b.sightings - a.sightings)
        .slice(0, config.grid.wordLimit);

    const cells = top
        .map((w, i) => {
            const x = config.grid.x + (i % config.grid.columns) * config.grid.cellWidth;
            const y = config.grid.y + Math.floor(i / config.grid.columns) * config.grid.cellHeight;
            const fontSize =
                config.grid.wordFontBase +
                Math.min(
                    config.grid.wordFontBonusCap,
                    Math.floor(w.sightings / config.grid.wordFontSightingDivisor),
                );
            return svgText({
                x: x + config.grid.cellWidth / 2,
                y: y + config.grid.cellHeight / 2,
                fontSize,
                fill: config.grid.wordFill,
                fontFamily: config.fontFamily,
                text: w.tp,
            });
        })
        .join("");

    const clearedBadge = snap.journeyCleared
        ? svgText({
              ...config.clearedBadge,
              fontFamily: config.fontFamily,
              text: config.clearedBadge.text ?? "",
          })
        : "";

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${config.viewBox}" width="${config.width}" height="${config.height}">`,
        `<rect width="${config.width}" height="${config.height}" fill="${config.backgroundFill}"/>`,
        `<rect x="${config.border.x}" y="${config.border.y}" width="${config.border.width}" height="${config.border.height}" fill="none" stroke="${config.border.stroke}" stroke-width="${config.border.strokeWidth}"/>`,
        svgText({ ...config.title, fontFamily: config.fontFamily, text: config.title.text ?? "" }),
        svgText({
            ...config.subtitle,
            fontFamily: config.fontFamily,
            text: config.subtitle.text ?? "",
        }),
        svgText({
            ...config.player,
            fontFamily: config.fontFamily,
            text: formatGameplayTemplate(config.player.template ?? "{player}", {
                player: snap.playerName,
            }),
        }),
        svgText({
            ...config.wordCount,
            fontFamily: config.fontFamily,
            text: String(snap.words.length),
        }),
        svgText({
            ...config.wordCountLabel,
            fontFamily: config.fontFamily,
            text: config.wordCountLabel.text ?? "",
        }),
        clearedBadge,
        cells,
        svgText({ ...config.date, fontFamily: config.fontFamily, text: exportDate(snap) }),
        `</svg>`,
    ].join("");
}

export async function buildDictionaryExportSnapshot(
    options: {
        playerName?: string;
        exportedAt?: string;
        masteryThreshold?: number;
    } = {},
): Promise<ExportSnapshot> {
    const [words, cleared] = await Promise.all([
        listMasteredWordRecords(
            options.masteryThreshold ?? VOCABULARY_SCREEN_CONFIG.masteryThreshold,
        ),
        getFlag(FINAL_BOSS_CONFIG.clearedFlag),
    ]);
    return {
        playerName: options.playerName ?? DICTIONARY_EXPORT_CONFIG.runtime.defaultPlayerName,
        words,
        journeyCleared: Boolean(cleared),
        ngPlusCount: 0,
        exportedAt: options.exportedAt ?? new Date().toISOString(),
    };
}

export async function showDictionaryExport(player: RpgPlayer): Promise<DictionaryExportPayload> {
    const snapshot = await buildDictionaryExportSnapshot();
    const payload: DictionaryExportPayload = {
        textCard: exportTextCard(snapshot),
        svgCard: exportSvgCard(snapshot),
        filename: DICTIONARY_EXPORT_CONFIG.runtime.downloadFilename,
    };
    player.emit(DICTIONARY_EXPORT_EVENT, payload);
    await player.showText(payload.textCard);
    return payload;
}

export function isDictionaryExportPayload(value: unknown): value is DictionaryExportPayload {
    if (!value || typeof value !== "object") return false;
    const payload = value as Partial<DictionaryExportPayload>;
    return (
        typeof payload.textCard === "string" &&
        typeof payload.svgCard === "string" &&
        typeof payload.filename === "string" &&
        payload.filename.endsWith(".svg")
    );
}

function textJourneyBadge(snap: ExportSnapshot): string {
    const config = DICTIONARY_EXPORT_CONFIG.textCard;
    if (!snap.journeyCleared) return config.inProgressBadge;
    if (snap.ngPlusCount <= 0) return config.clearedBadge;
    return formatGameplayTemplate(config.ngPlusBadgeTemplate, { count: snap.ngPlusCount + 1 });
}

function exportDate(snap: ExportSnapshot): string {
    return snap.exportedAt.slice(0, 10);
}

function svgText(node: {
    x: number;
    y: number;
    fontSize: number;
    fill: string;
    fontFamily: string;
    text: string;
}): string {
    return `<text x="${node.x}" y="${node.y}" font-size="${node.fontSize}" fill="${node.fill}" text-anchor="middle" font-family="${escapeXml(node.fontFamily)}">${escapeXml(node.text)}</text>`;
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
