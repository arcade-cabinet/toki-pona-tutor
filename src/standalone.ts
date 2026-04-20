// RPG.js UI CSS — imported here so Vite bundles them into the build output
// rather than pointing at ./node_modules/ paths that don't exist in dist/.
import '@rpgjs/ui-css/reset.css';
import '@rpgjs/ui-css/tokens.css';
import '@rpgjs/ui-css/index.css';
import '@rpgjs/ui-css/theme-default.css';

import { mergeConfig } from '@signe/di';
import { provideRpg, startGame } from '@rpgjs/client';
import serverConfig from './server';
import configClient from './config/config.client';

startGame(
    mergeConfig(configClient, {
        providers: [provideRpg(serverConfig)],
    })
);
