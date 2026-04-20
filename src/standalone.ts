// RPG.js UI CSS — imported here so Vite bundles them into the build output
// rather than pointing at ./node_modules/ paths that don't exist in dist/.
// Order matters: library tokens first, then brand overrides win without
// needing !important. See docs/BRAND.md.
import '@rpgjs/ui-css/reset.css';
import '@rpgjs/ui-css/tokens.css';
import '@rpgjs/ui-css/index.css';
import '@rpgjs/ui-css/theme-default.css';
import './styles/fonts.css';
import './styles/brand.css';

import { mergeConfig } from '@signe/di';
import { provideRpg, startGame, inject, RpgClientEngine } from '@rpgjs/client';
import serverConfig from './server';
import configClient from './config/config.client';
import { applyBrandBoot } from './styles/boot';

// Apply brand prefs (high-contrast, etc.) before first render so the
// initial paint matches the user's stored settings. Fire-and-forget;
// applyBrandBoot guards against missing DOM (SSR / tests).
void applyBrandBoot();

startGame(
    mergeConfig(configClient, {
        providers: [provideRpg(serverConfig)],
    })
);

// Dev/test debug surface. Mirrors the stellar-descent pattern:
// E2E tests probe `window.__POKI__` via `page.evaluate` to read
// player + canvas state. Gated on import.meta.env so the production
// bundle tree-shakes the hook out. Typed in src/types/poki-debug.d.ts.
//
// Install the object IMMEDIATELY with ready:false so E2E tests can
// always observe the shape (and get a clear "ready=false" signal if
// boot never completes) rather than timing out waiting for
// `window.__POKI__` to exist at all. Engine injection happens
// asynchronously via a retry loop that backs off until DI is ready;
// once the engine resolves we swap the placeholder for the live
// accessors.
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    type CanvasOrNull = HTMLCanvasElement | null;
    const canvasEl = (): CanvasOrNull =>
        document.querySelector<HTMLCanvasElement>('#rpg canvas');

    // Placeholder — exists the instant the module evaluates so tests
    // can always see a consistent shape, even pre-engine-boot.
    window.__POKI__ = {
        engine: null,
        get player() { return null; },
        get playerId() { return null; },
        get canvas() { return canvasEl(); },
        get ready() { return false; },
    };

    const MAX_ATTEMPTS = 200; // 200 × 50ms = 10s hard ceiling
    let attempts = 0;
    const tryInstall = (): void => {
        attempts++;
        try {
            const engine = inject(RpgClientEngine);
            if (!engine) {
                if (attempts < MAX_ATTEMPTS) setTimeout(tryInstall, 50);
                return;
            }
            window.__POKI__ = {
                engine,
                get player() { return engine.getCurrentPlayer?.() ?? null; },
                get playerId() { return engine.playerIdSignal?.() ?? null; },
                get canvas() { return canvasEl(); },
                /**
                 * Ready = engine + canvas + current player all live.
                 * Playwright polls this via `page.waitForFunction`.
                 */
                get ready() {
                    return !!engine.getCurrentPlayer?.() && !!canvasEl();
                },
            };
        } catch {
            if (attempts < MAX_ATTEMPTS) setTimeout(tryInstall, 50);
        }
    };
    // First attempt happens on the next microtask — startGame()'s DI
    // setup needs at least one macrotask to finish wiring.
    queueMicrotask(tryInstall);
}
