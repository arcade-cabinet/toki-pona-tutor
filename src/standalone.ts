// RPG.js UI CSS — imported here so Vite bundles them into the build output
// rather than pointing at ./node_modules/ paths that don't exist in dist/.
// Order matters: library tokens first, then brand overrides win without
// needing !important. See docs/BRAND.md.
import '@rpgjs/ui-css/reset.css';
import '@rpgjs/ui-css/tokens.css';
import '@rpgjs/ui-css/index.css';
import '@rpgjs/ui-css/theme-default.css';
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
// player state, current map, dialog state, etc. Gated on import.meta.env
// so the production bundle doesn't leak the hook. Tree-shaken out at
// build time when MODE === 'production'.
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    // Defer until the client engine has been wired — startGame() kicks
    // off DI resolution; the engine becomes injectable a tick later.
    queueMicrotask(() => {
        try {
            const engine = inject(RpgClientEngine);
            (window as unknown as { __POKI__: unknown }).__POKI__ = {
                engine,
                get player() {
                    return engine.getCurrentPlayer?.() ?? null;
                },
                get playerId() {
                    return engine.playerIdSignal?.() ?? null;
                },
                get canvas() {
                    return document.querySelector('#rpg canvas') as HTMLCanvasElement | null;
                },
                /**
                 * Ready = canvas mounted AND current player exists.
                 * Playwright polls this in a `page.waitForFunction`.
                 */
                get ready(): boolean {
                    const player = engine.getCurrentPlayer?.();
                    const canvas = document.querySelector('#rpg canvas');
                    return !!player && !!canvas;
                },
            };
        } catch (e) {
            // Non-fatal — if the debug surface can't be established
            // (e.g. engine DI not ready), E2E will time out with a
            // clearer "window.__POKI__ missing" error than a silent
            // hang.
            console.warn('[poki] debug surface setup deferred:', e);
        }
    });
}
