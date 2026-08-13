import { defineConfig, devices } from '@playwright/test';

// E2E gegen das Frontend; die API wird je Test im Browser gemockt (page.route),
// analog zu den FE-Repos provisioncalculator-fe / announcement-service-ui — kein
// Backend nötig, dadurch schnell und deterministisch.
const PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox'],
          // Optionaler Escape-Hatch: in vorbereiteten Umgebungen (Chromium bereits
          // installiert) auf das vorhandene Binary zeigen. In CI ungesetzt → Playwright
          // nutzt den per `playwright install` geholten Browser.
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
