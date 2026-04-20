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
import { provideRpg, startGame } from '@rpgjs/client';
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
