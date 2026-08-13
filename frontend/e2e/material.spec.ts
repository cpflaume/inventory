import { expect, test } from '@playwright/test';
import { openSeededDepot } from './helpers';

// Use-Case: Material ansehen (geseedet) und ein neues Teil hinzufügen.
test('Material hinzufügen', async ({ page }) => {
  await openSeededDepot(page);
  await page.getByRole('link', { name: /Material/ }).click();

  // Aus dem Seed vorhandenes Material.
  await expect(page.getByText('Hammer')).toBeVisible();

  const name = `Zelthering ${Date.now()}`;
  await page.getByPlaceholder(/Was\?/).fill(name);
  await page.getByRole('button', { name: '+ Hinzufügen' }).click();

  await expect(page.getByText(name)).toBeVisible();
});
