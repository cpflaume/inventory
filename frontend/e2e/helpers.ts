import { expect, type Page } from '@playwright/test';

// Name des Lagers aus dem Backend-Seed (DemoDataSeeder / APP_SEED_DEMO=true).
export const SEED_DEPOT = 'Stamm Grauer Reiter';

/** Öffnet das geseedete Lager über die Startseite und wartet aufs virtuelle Lager. */
export async function openSeededDepot(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByText(SEED_DEPOT).click();
  await expect(page.getByRole('heading', { name: /Virtuelles Lager/ })).toBeVisible();
}
