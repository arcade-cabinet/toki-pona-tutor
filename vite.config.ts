import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/toki-pona-tutor/',
  plugins: [react()],
});
