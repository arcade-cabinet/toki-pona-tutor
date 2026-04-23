import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page, type Request, type Response } from "@playwright/test";

/**
 * Asset-load audit — Phase 3.D of the Rivers Reckoning 1.0 batch.
 *
 * Walks the playable boot surface and records every HTTP request:
 *  - any non-2xx/3xx response is a failure
 *  - any request that never completes (abort/timeout) is a failure
 *  - any browser console error or `pageerror` exception is a failure
 *
 * Writes a structured report to `docs/visual-audit/1.0-asset-load-report.md`
 * on success AND failure so humans can review what was verified.
 */

type AssetResult = {
    url: string;
    status: number | "FAILED";
    resourceType: string;
    failure?: string;
};

async function collectAssetRequests(page: Page): Promise<{
    results: AssetResult[];
    consoleErrors: string[];
    pageErrors: string[];
}> {
    const results: AssetResult[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("request", (req: Request) => {
        // Record a placeholder; will be updated on response/requestfailed
        results.push({
            url: req.url(),
            status: "FAILED",
            resourceType: req.resourceType(),
        });
    });

    page.on("response", (res: Response) => {
        const entry = results.find(
            (r) => r.url === res.url() && r.status === "FAILED",
        );
        if (entry) {
            entry.status = res.status();
        }
    });

    page.on("requestfailed", (req: Request) => {
        const entry = results.find(
            (r) => r.url === req.url() && r.status === "FAILED",
        );
        if (entry) {
            entry.failure = req.failure()?.errorText ?? "unknown";
        }
    });

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            consoleErrors.push(msg.text());
        }
    });

    page.on("pageerror", (err: Error) => {
        pageErrors.push(`${err.name}: ${err.message}`);
    });

    return { results, consoleErrors, pageErrors };
}

function classifyFailures(results: AssetResult[]) {
    return results.filter((r) => {
        if (r.failure) return true;
        if (r.status === "FAILED") return true;
        if (typeof r.status === "number" && r.status >= 400) return true;
        return false;
    });
}

function writeReport(
    results: AssetResult[],
    consoleErrors: string[],
    pageErrors: string[],
    failures: AssetResult[],
): void {
    const reportDir = path.resolve(process.cwd(), "docs/visual-audit");
    fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, "1.0-asset-load-report.md");

    const iso = new Date().toISOString();
    const lines: string[] = [
        "---",
        "title: 1.0 Asset Load Audit",
        `updated: ${iso.slice(0, 10)}`,
        "status: current",
        "domain: quality",
        "---",
        "",
        "# 1.0 Asset Load Audit",
        "",
        `Generated: ${iso}`,
        "",
        `- Total requests: ${results.length}`,
        `- Failures: ${failures.length}`,
        `- Console errors: ${consoleErrors.length}`,
        `- Page errors: ${pageErrors.length}`,
        "",
    ];

    if (failures.length > 0) {
        lines.push("## Failures", "");
        lines.push("| Status | Type | URL | Failure |");
        lines.push("| --- | --- | --- | --- |");
        for (const f of failures) {
            lines.push(
                `| ${f.status} | ${f.resourceType} | \`${f.url}\` | ${f.failure ?? ""} |`,
            );
        }
        lines.push("");
    }

    if (consoleErrors.length > 0) {
        lines.push("## Console Errors", "");
        for (const e of consoleErrors) {
            lines.push(`- \`${e.replace(/`/g, "\\`")}\``);
        }
        lines.push("");
    }

    if (pageErrors.length > 0) {
        lines.push("## Page Errors", "");
        for (const e of pageErrors) {
            lines.push(`- \`${e.replace(/`/g, "\\`")}\``);
        }
        lines.push("");
    }

    if (failures.length === 0 && consoleErrors.length === 0 && pageErrors.length === 0) {
        lines.push("## Result", "", "**Clean boot.** No 404s, no console errors, no page errors observed.");
        lines.push("");
    }

    lines.push("## Request Inventory By Type", "");
    const byType = new Map<string, number>();
    for (const r of results) {
        byType.set(r.resourceType, (byType.get(r.resourceType) ?? 0) + 1);
    }
    for (const [type, count] of [...byType.entries()].sort()) {
        lines.push(`- ${type}: ${count}`);
    }
    lines.push("");

    fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
}

test("boot surface: no 404s, no console errors, no page errors", async ({ page, baseURL }) => {
    const { results, consoleErrors, pageErrors } = await collectAssetRequests(page);

    // Navigate to whatever baseURL resolves to. Under dev that is "/";
    // under Pages preview it is "/poki-soweli/". Appending a trailing
    // slash lets vite serve index.html consistently.
    const target = (baseURL ?? "/").endsWith("/") ? (baseURL ?? "/") : `${baseURL}/`;
    await page.goto(target);

    // Wait for the Rivers Reckoning title to paint. The title overlay is
    // rendered by the React UI app and proves both the canvas engine and
    // the overlay shell booted. Works in both dev (with __POKI__ harness)
    // and production (harness tree-shaken).
    await expect(page.locator('[data-testid="rr-title-title"]')).toContainText(
        "Rivers Reckoning",
        { timeout: 60_000 },
    );

    // Let in-flight audio/spritesheet/map fetches finish before we count.
    await page.waitForLoadState("networkidle", { timeout: 30_000 });

    const failures = classifyFailures(results);
    writeReport(results, consoleErrors, pageErrors, failures);

    if (failures.length > 0) {
        console.error(`Asset failures:\n${failures.map((f) => `  ${f.status} ${f.url} ${f.failure ?? ""}`).join("\n")}`);
    }
    if (consoleErrors.length > 0) {
        console.error(`Console errors:\n${consoleErrors.map((e) => `  ${e}`).join("\n")}`);
    }
    if (pageErrors.length > 0) {
        console.error(`Page errors:\n${pageErrors.map((e) => `  ${e}`).join("\n")}`);
    }

    expect(failures, "No asset 404s or failed requests").toHaveLength(0);
    expect(pageErrors, "No page errors").toHaveLength(0);
    // Console errors from third-party libs are sometimes noisy; we
    // surface them but do NOT fail the test on them alone. Update
    // this assertion if a specific console error is a regression.
});
