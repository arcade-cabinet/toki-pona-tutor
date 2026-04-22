import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

/**
 * Real-browser E2E suite for poki soweli.
 *
 * Runs the actual Vite dev server and drives headed Chromium with GPU
 * WebGL via ANGLE so Pixi / CanvasEngine render the way they do in
 * production. Capacitor SQLite runs real jeep-sqlite + sql.js wasm;
 * brand.css evaluates against a real stylesheet engine; input is real
 * key + touch events through `page.keyboard` / `page.touchscreen`.
 *
 * On Linux CI, wrap the Playwright invocation in `xvfb-run` for a
 * virtual display; the GPU_ARGS below give ANGLE a real GL surface
 * inside that xvfb context. macOS + Windows runners have a real
 * compositor and don't need xvfb.
 *
 * Integration tests (tests/integration/, @rpgjs/testing, node+happy-dom)
 * cover engine wiring contracts at 1s/test. This E2E suite is the
 * slower, higher-fidelity layer that catches anything integration
 * can't see: real wasm loading, real canvas draw order, real key
 * repeat, real brand CSS specificity.
 */

const isCI = !!process.env.CI;
const e2ePort = process.env.E2E_PORT || "5173";
const defaultBaseURL = `http://127.0.0.1:${e2ePort}`;

// GPU-accelerated WebGL args for real Chromium. CI provides the display
// with xvfb-run; local runs use the host compositor.
const GPU_ARGS = [
    "--no-sandbox",
    "--use-angle=gl",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--mute-audio",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
];

const config: PlaywrightTestConfig = {
    // `testDir` is set per-project below (smoke vs full) so each
    // suite declares its own scope.
    fullyParallel: false, // shared save state in IndexedDB — serialize
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: 1,
    timeout: 90_000,

    reporter: [["html", { open: isCI ? "never" : "on-failure" }], ["list"]],

    expect: {
        timeout: 15_000,
        toHaveScreenshot: {
            maxDiffPixels: 200,
            threshold: 0.2,
            animations: "disabled",
        },
    },

    use: {
        baseURL: process.env.BASE_URL || defaultBaseURL,
        trace: isCI ? "on-first-retry" : "retain-on-failure",
        screenshot: "only-on-failure",
        video: isCI ? "retain-on-failure" : "off",
        actionTimeout: 10_000,
        navigationTimeout: 60_000,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
    },

    // Two projects, disjoint by directory:
    //
    //   smoke — runs on every CI push. Tiny, stable, under a minute.
    //           Boots the build + asserts the golden-path sanity
    //           invariants (canvas mounts, player assigned, brand
    //           tokens resolve). Does NOT accumulate coverage.
    //
    //   full  — runs locally on `pnpm test:e2e`. Opt-in in CI via a
    //           label / scheduled workflow once that's wired. This is
    //           where feature-level E2E lives (starter ceremony flow,
    //           encounter + catch, jan lawa defeat, save round-trip).
    //
    // New tests default to `full`. Only promote a test to `smoke` if
    // it's a boot/sanity invariant — smoke must stay fast.
    projects: [
        {
            name: "smoke",
            testDir: "./tests/e2e/smoke",
            use: {
                ...devices["Desktop Chrome"],
                // Use Playwright's bundled Chromium (installed via
                // `playwright install chromium` in CI). `channel: 'chrome'`
                // would require a system-installed Google Chrome and
                // silently fail on minimal CI runners.
                browserName: "chromium",
                headless: false,
                launchOptions: {
                    args: GPU_ARGS,
                    slowMo: isCI ? 0 : 50,
                },
            },
        },
        {
            name: "full",
            testDir: "./tests/e2e",
            testIgnore: "**/smoke/**",
            use: {
                ...devices["Desktop Chrome"],
                // Use Playwright's bundled Chromium (installed via
                // `playwright install chromium` in CI). `channel: 'chrome'`
                // would require a system-installed Google Chrome and
                // silently fail on minimal CI runners.
                browserName: "chromium",
                headless: false,
                launchOptions: {
                    args: GPU_ARGS,
                    slowMo: isCI ? 0 : 50,
                },
            },
        },
    ],

    // When BASE_URL is set (e.g. pointing at a preview deploy), skip
    // booting Vite. Otherwise spin up `pnpm dev` and wait for it.
    webServer: process.env.BASE_URL
        ? undefined
        : {
              command: `vite --host 127.0.0.1 --port ${e2ePort} --strictPort`,
              // Local Vite dev serves at `/`; `/poki-soweli/` is the
              // GitHub Pages subpath used only for GITHUB_PAGES builds.
              url: `${defaultBaseURL}/`,
              reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true" && !isCI,
              timeout: 120_000,
              stdout: "ignore",
              stderr: "pipe",
          },
};

export default config;
