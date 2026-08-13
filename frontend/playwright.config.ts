import { defineConfig, devices } from '@playwright/test';

// E2E gegen das ECHTE Backend (Spring Boot + Postgres, mit Seed-Testdaten).
// Der Playwright-webServer startet nur das Frontend (Vite-Dev), das seine
// /api-Aufrufe an das laufende Backend (localhost:8080) proxied.
// Voraussetzung: das Backend läuft bereits (lokal: `docker compose up`; CI:
// eigener Schritt startet die gebaute Jar gegen einen Postgres-Service-Container).
const PORT = 5174;

// Video-Aufzeichnung. Default: alle Tests aufnehmen, aber nur die Videos
// FEHLGESCHLAGENER Tests behalten. Mit E2E_VIDEO=all werden die Videos ALLER
// Tests behalten (z.B. `npm run e2e:video` oder CI-Input `record_all_videos`).
const video: 'on' | 'retain-on-failure' = process.env.E2E_VIDEO === 'all' ? 'on' : 'retain-on-failure';

export default defineConfig({
  testDir: './e2e',
  // Ein gemeinsames Backend → Tests seriell, damit sie sich nicht ins Gehege kommen.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Einmal als Admin anmelden; alle Specs starten mit diesem Login (storageState).
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    video,
    storageState: 'e2e/.auth/admin.json',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // --no-proxy-server: direkt gegen localhost (in Sandbox-Umgebungen mit
          // System-Proxy nötig, in CI ein No-Op).
          args: ['--no-sandbox', '--no-proxy-server'],
          // Escape-Hatch: in vorbereiteten Umgebungen auf ein vorhandenes Chromium
          // zeigen. In CI ungesetzt → Playwright nutzt den installierten Browser.
          ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
            : {}),
        },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
