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
    const lines: string[] = [];
    const badge = snap.journeyCleared
        ? snap.ngPlusCount > 0
            ? `★ akesi sewi defeated × ${snap.ngPlusCount + 1}`
            : '★ akesi sewi defeated'
        : '… journey in progress';

    lines.push('═══ lipu nimi — poki soweli ═══');
    lines.push(`  jan ${snap.playerName}`);
    lines.push(`  ${badge}`);
    lines.push(`  tenpo pi pana: ${snap.exportedAt.slice(0, 10)}`);
    lines.push(`  nimi sona: ${snap.words.length}`);
    lines.push('');

    if (snap.words.length === 0) {
        lines.push('  (nimi ala — catch and talk to find them)');
        return lines.join('\n');
    }

    // Top-20 by sightings, tie-break by mastered_at asc (older first so
    // the player's journey order shows through).
    const topSighted = [...snap.words]
        .sort((a, b) => {
            if (b.sightings !== a.sightings) return b.sightings - a.sightings;
            return a.mastered_at.localeCompare(b.mastered_at);
        })
        .slice(0, 20);

    lines.push('  ═ nimi lukin mute ═');
    for (const w of topSighted) {
        lines.push(`    ${w.tp.padEnd(14)} ${'·'.repeat(Math.min(10, w.sightings))}`);
    }

    return lines.join('\n');
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
    const top = [...snap.words]
        .sort((a, b) => b.sightings - a.sightings)
        .slice(0, 24);

    // Word cells — 6 columns × 4 rows, 60×80 each starting at (20, 260).
    const cellW = 60;
    const cellH = 80;
    const gridX = 20;
    const gridY = 260;
    const cols = 6;
    const cells = top.map((w, i) => {
        const x = gridX + (i % cols) * cellW;
        const y = gridY + Math.floor(i / cols) * cellH;
        const fontSize = 11 + Math.min(6, Math.floor(w.sightings / 3));
        return `<text x="${x + cellW / 2}" y="${y + cellH / 2}" font-size="${fontSize}" fill="#f5e6c8" text-anchor="middle" font-family="serif">${escapeXml(w.tp)}</text>`;
    }).join('');

    const clearedBadge = snap.journeyCleared
        ? `<text x="200" y="220" font-size="14" fill="#e5a42c" text-anchor="middle" font-family="serif">akesi sewi — moli</text>`
        : '';

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">`,
        `<rect width="400" height="600" fill="#1b1510"/>`,
        `<rect x="10" y="10" width="380" height="580" fill="none" stroke="#c9a268" stroke-width="2"/>`,
        `<text x="200" y="60" font-size="22" fill="#f5e6c8" text-anchor="middle" font-family="serif">lipu nimi</text>`,
        `<text x="200" y="90" font-size="14" fill="#c9a268" text-anchor="middle" font-family="serif">poki soweli</text>`,
        `<text x="200" y="140" font-size="16" fill="#f5e6c8" text-anchor="middle" font-family="serif">jan ${escapeXml(snap.playerName)}</text>`,
        `<text x="200" y="185" font-size="48" fill="#86a856" text-anchor="middle" font-family="serif">${snap.words.length}</text>`,
        `<text x="200" y="205" font-size="11" fill="#c9a268" text-anchor="middle" font-family="serif">nimi sona</text>`,
        clearedBadge,
        cells,
        `<text x="200" y="585" font-size="9" fill="#c9a268" text-anchor="middle" font-family="serif">${snap.exportedAt.slice(0, 10)}</text>`,
        `</svg>`,
    ].join('');
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
