import { expect, test } from '@playwright/test';
import { SEED_DEPOT } from './helpers';

// Use-Case: Lager-Übersicht (geseedetes Lager sichtbar) und ein neues Lager anlegen.
test('Lager-Übersicht und Lager anlegen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Jurtenburg' })).toBeVisible();

  // Aus dem Seed vorhandenes Lager.
  await expect(page.getByText(SEED_DEPOT)).toBeVisible();

  // Neues Lager anlegen (eindeutiger Name, damit parallele Läufe nicht kollidieren).
  const name = `E2E-Lager ${Date.now()}`;
  await page.getByPlaceholder(/Neues Lager/).fill(name);
  await page.getByRole('button', { name: 'Anlegen' }).click();

  await expect(page.getByText(name)).toBeVisible();
});
