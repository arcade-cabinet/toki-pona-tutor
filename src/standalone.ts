// RPG.js UI CSS — imported here so Vite bundles them into the build output
// rather than pointing at ./node_modules/ paths that don't exist in dist/.
import '@rpgjs/ui-css/src/reset.css';
import '@rpgjs/ui-css/src/index.css';
import '@rpgjs/ui-css/src/theme-default/theme.css';

import { mergeConfig } from '@signe/di';
import { provideRpg, startGame } from '@rpgjs/client';
import serverConfig from './server';
import configClient from './config/config.client';

startGame(
    mergeConfig(configClient, {
        providers: [provideRpg(serverConfig)],
    })
);
