import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Angezeigte Version = Release-Tag, zur Build-Zeit über APP_VERSION hereingereicht
// (frontend/Dockerfile-ARG, gefüttert aus release.yml mit dem GitHub-Release-Tag).
// Bewusst NICHT aus der package.json — die ist statisch und lief dem Release-Tag
// hinterher. Lokal/ohne Release-Build: „dev".
const appVersion = process.env.APP_VERSION?.trim() || 'dev';

// Dev-Proxy: /api → Backend, damit lokal ohne CORS gearbeitet werden kann.
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Nur Unit-/Component-Tests unter src/ — die Playwright-E2E in e2e/ laufen separat.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
