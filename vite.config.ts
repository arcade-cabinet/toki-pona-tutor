import { defineConfig } from 'vite';
import { rpgjs, tiledMapFolderPlugin } from '@rpgjs/vite';
import startServer from './src/server';

export default defineConfig({
  base: '/toki-pona-tutor/',
  plugins: [
    tiledMapFolderPlugin({
      sourceFolder: './src/tiled',
      publicPath: '/map',
      buildOutputPath: 'assets/data',
    }),
    ...rpgjs({
      server: startServer,
    }),
  ],
});
