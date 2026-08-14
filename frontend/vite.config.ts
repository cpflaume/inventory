import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// App-Version aus der package.json ins Bundle spiegeln (in der UI angezeigt).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// Dev-Proxy: /api → Backend, damit lokal ohne CORS gearbeitet werden kann.
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
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
