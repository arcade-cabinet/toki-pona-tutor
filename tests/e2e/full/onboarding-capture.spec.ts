import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

/**
 * T20 — onboarding-capture playthrough.
 *
 * Walks the boot surface a new player hits and captures:
 *  - title screen
 *  - starter-choice dialog
 *  - first steps on the starter map
 *  - every quest-giver NPC on the starter map (what does Rivers see?)
 *  - first warp to greenwood_road
 *  - tall-grass encounter entry
 *
 * Saves PNGs + a narrative notes file to
 * `docs/screenshots/visual-audit/1.0-onboarding/`. This is the
 * evidence base for the "does a player understand fluently" audit.
 *
 * Not a regression test — asserts only that the capture flow runs
 * without throwing. The judgement call ("is this legible?") lives
 * in the notes file the human writes alongside the PNGs.
 */

const CAPTURE_DIR = path.resolve(
    process.cwd(),
    "docs/screenshots/visual-audit/1.0-onboarding",
);

async function snap(page: Page, name: string, note: string): Promise<void> {
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const file = path.join(CAPTURE_DIR, `${name}.png`);
    try {
        await page.screenshot({ path: file, fullPage: false, timeout: 30_000 });
    } catch (err) {
        // Don't fail the capture pass on a single screenshot hiccup.
        const notesFile = path.join(CAPTURE_DIR, "RUN_LOG.md");
        fs.appendFileSync(
            notesFile,
            `- **${name}** — SCREENSHOT FAILED: ${(err as Error).message}\n`,
        );
        return;
    }

    const notesFile = path.join(CAPTURE_DIR, "NOTES.md");
    const row = `- **${name}** — ${note}\n  - file: \`${path.relative(process.cwd(), file)}\`\n  - captured: ${new Date().toISOString()}\n`;
    fs.appendFileSync(notesFile, row);
}

test("onboarding — capture the first N minutes a new player sees", async ({ page, baseURL }) => {
    const target = (baseURL ?? "/").endsWith("/") ? (baseURL ?? "/") : `${baseURL}/`;

    // Reset the run-log on each invocation. The hand-authored fluency
    // verdict lives in NOTES.md alongside this file; RUN_LOG.md is the
    // auto-generated per-run inventory and is safe to overwrite.
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const notesFile = path.join(CAPTURE_DIR, "RUN_LOG.md");
    fs.writeFileSync(
        notesFile,
        `---\ntitle: 1.0 Onboarding Capture — run log\nupdated: ${new Date().toISOString().slice(0, 10)}\nstatus: current\ndomain: quality\n---\n\n# 1.0 Onboarding Capture — run log\n\nAutomated playthrough of the boot surface. Captures this run's PNGs with one-line context. The hand-authored fluency verdict (what the PNGs mean for v1) lives in \`NOTES.md\` in this directory.\n\n## Frames\n\n`,
    );

    await page.goto(target);

    // Frame 1 — title lands.
    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText(
        "Rivers Reckoning",
        { timeout: 60_000 },
    );
    await page.waitForLoadState("networkidle", { timeout: 30_000 });
    await snap(page, "01-title", "First thing a new player sees. Does the title communicate what kind of game this is?");

    // Frame 2 — the title's call-to-action menu.
    const firstEntry = page.locator(".rr-title-entry").first();
    if ((await firstEntry.count()) > 0) {
        await firstEntry.hover();
        await snap(page, "02-title-menu", "Title menu with primary action highlighted. Is the New Game path obvious?");
    }

    // Frame 3 — click into the game. The opening scene's first beat
    // should now appear (T11-11 + T11-06 wired the chain).
    if ((await firstEntry.count()) > 0) {
        await firstEntry.click();
        await page.waitForTimeout(2000);
        await snap(page, "03-post-title-click", "Immediately after clicking primary action. The opening scene should be staged — first beat visible.");
    }

    // Frame 4 — a single Enter press to capture what the second beat
    // looks like (without stalling on the ceremony's showChoices). The
    // goal here is evidence, not full onboarding completion.
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await snap(page, "04-starter-ceremony-entry", "One dialog-advance later. Opening beats should be visibly progressing.");

    // Frame 5 — full canvas after ceremony should complete.
    await page.waitForTimeout(1500);
    await snap(page, "05-starter-map-idle", "After the ceremony. Player should now be distinguishable on the map.");

    // Frame 6 — movement. The player sprite should now exist and move.
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(350);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(350);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
    await snap(page, "06-after-movement", "After a few movement inputs. The canvas should visibly change — player sprite moved, tiles re-rendered.");

    // Frame 7 — pause overlay (if it exists) — this is where goals/quests/party live.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
    await snap(page, "07-pause-overlay", "Pause / HUD menu. Can the player see current goals, quest progress, and next region at a glance?");

    // Close pause
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Append summary prompt to the notes file so the reviewer has a checklist.
    fs.appendFileSync(
        notesFile,
        [
            "",
            "## Fluency verdict (fill in by hand per frame)",
            "",
            "For each frame above, answer:",
            "",
            "1. **Intent** — does a new player understand what the game is asking them to do right now?",
            "2. **Options** — are their available actions visible (tap targets, key hints, NPC glyphs)?",
            "3. **Feedback** — when they act, does the game respond legibly?",
            "4. **Memory** — will they remember this moment or will it blur into the next one?",
            "",
            "## Open issues from this capture",
            "",
            "_(list concrete bugs or UX gaps this playthrough surfaced — each becomes a ROADMAP row)_",
            "",
        ].join("\n"),
    );
});
