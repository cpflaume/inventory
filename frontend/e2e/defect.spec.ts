import { expect, test } from '@playwright/test';
import { openSeededDepot } from './helpers';

// Use-Case: Mängel ansehen (geseedet) und am Lagerplatz einen neuen melden.
test('Mängelmeldung abgeben', async ({ page }) => {
  await openSeededDepot(page);
  await page.getByRole('link', { name: /Mängel/ }).click();

  // Aus dem Seed vorhandener offener Mangel.
  await expect(page.getByText('Loch in Seitenplane')).toBeVisible();

  // Neuen Mangel melden.
  await page.getByRole('button', { name: /Defekt/ }).click();
  const title = `Riss im Dach ${Date.now()}`;
  await page.getByPlaceholder(/Was ist kaputt/).fill(title);
  await page.getByRole('button', { name: 'Mangel melden' }).click();

  await expect(page.getByText(title)).toBeVisible();
});
