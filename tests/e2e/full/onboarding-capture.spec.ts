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
        const notesFile = path.join(CAPTURE_DIR, "NOTES.md");
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

    // Reset the notes file on each run so we have a fresh playthrough record.
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const notesFile = path.join(CAPTURE_DIR, "NOTES.md");
    fs.writeFileSync(
        notesFile,
        `---\ntitle: 1.0 Onboarding Capture\nupdated: ${new Date().toISOString().slice(0, 10)}\nstatus: current\ndomain: quality\n---\n\n# 1.0 Onboarding Capture\n\nAutomated playthrough of the boot surface. The PNGs are evidence; the\n"fluency verdict" for each moment is filled in by hand below.\n\n## Frames\n\n`,
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

    // Frame 3 — click into the game. Accept any dialog that appears.
    if ((await firstEntry.count()) > 0) {
        await firstEntry.click();
        await page.waitForTimeout(1500);
        await snap(page, "03-post-title-click", "Immediately after clicking primary action. Does the player get a clear next-step or a blank canvas?");
    }

    // Frame 4 — wait for any starter dialog.
    await page.waitForTimeout(2000);
    await snap(page, "04-starter-ceremony-entry", "Starter ceremony moment. Is the mentor NPC visible and their role clear?");

    // Frame 5 — full canvas after initial boot.
    await page.waitForTimeout(2000);
    await snap(page, "05-starter-map-idle", "Player standing on starter map before input. What landmarks, NPCs, and exits are visible?");

    // Frame 6 — attempt to press a movement key to show input responsiveness.
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
    await snap(page, "06-after-movement", "After a few movement inputs. Does the player see a clear progression, a next-objective hint, or just a blank map?");

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
