import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import solid from 'vite-plugin-solid';

// React handles all .tsx by default. Solid plugin is scoped to files inside
// src/game/solid-ui/ so the two runtimes don't fight for JSX transforms.
export default defineConfig({
  base: '/toki-pona-tutor/',
  plugins: [
    react({
      exclude: [/src\/game\/solid-ui\/.*/],
    }),
    solid({
      include: [/src\/game\/solid-ui\/.*\.tsx?$/],
    }),
  ],
  optimizeDeps: {
    exclude: ['phaser'],
  },
});
