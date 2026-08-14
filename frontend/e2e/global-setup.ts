import { chromium, type FullConfig } from '@playwright/test';

// Meldet sich einmal als (geseedeter) Admin an und speichert den Login-Zustand
// (localStorage-Token) als storageState, den alle Specs wiederverwenden.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5174';
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ['--no-sandbox', '--no-proxy-server'],
  });
  const page = await browser.newPage({ baseURL });
  await page.goto('/login');
  await page.getByPlaceholder('E-Mail').fill(process.env.E2E_ADMIN_USER || 'admin@jurtenburg.local');
  await page.getByPlaceholder('Passwort').fill(process.env.E2E_ADMIN_PASSWORD || 'admin12345');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  // Erfolgreich, sobald die Lager-Übersicht erscheint.
  await page.getByText('Deine Lager').waitFor({ timeout: 15_000 });
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
  await browser.close();
}
