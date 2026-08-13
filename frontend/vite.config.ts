import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-Proxy: /api → Backend, damit lokal ohne CORS gearbeitet werden kann.
export default defineConfig({
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
