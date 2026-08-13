import { expect, test } from '@playwright/test';
import { openSeededDepot } from './helpers';

// Use-Case: Beipackzettel einer Kiste drucken (Druckansicht öffnet in neuem Tab).
test('Beipackzettel drucken', async ({ page }) => {
  await openSeededDepot(page);

  // Kiste öffnen und den Beipackzettel-Link (target=_blank) folgen.
  await page.getByRole('button', { name: /Kiste 1 · Jurtendach/ }).click();
  const [printPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: /Beipackzettel drucken/ }).click(),
  ]);

  await expect(printPage.getByRole('heading', { name: /Kiste 1 · Jurtendach/ })).toBeVisible();
  await expect(printPage.getByText('Beipackzettel')).toBeVisible();
  await expect(printPage.getByText('Jurtendach', { exact: true })).toBeVisible();
  await expect(printPage.getByRole('button', { name: /Drucken/ })).toBeVisible();
});
