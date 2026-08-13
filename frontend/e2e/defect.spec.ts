import { expect, test } from '@playwright/test';
import { emptyState, mockApi } from './mocks';

// Use-Case: Mängelmeldung am Lagerplatz abgeben.
test('Mängelmeldung abgeben', async ({ page }) => {
  await mockApi(page, emptyState());

  await page.goto('/lager/d1/mangel');
  await expect(page.getByRole('heading', { name: /Mängelmeldung/ })).toBeVisible();

  // Schweregrad "Defekt" wählen und Titel eingeben.
  await page.getByRole('button', { name: /Defekt/ }).click();
  await page.getByPlaceholder(/Was ist kaputt/).fill('Loch in Seitenplane');
  await page.getByRole('button', { name: 'Mangel melden' }).click();

  // Erscheint in der Liste der offenen Mängel.
  await expect(page.getByText('Loch in Seitenplane')).toBeVisible();
});
