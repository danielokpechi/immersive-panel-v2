import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// V2 deploys as a static SPA. `base` defaults to '/' (custom domain / root
// host); override with BASE_PATH for a project sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
