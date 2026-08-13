import { expect, test } from '@playwright/test';
import { emptyState, mockApi } from './mocks';

// Use-Case: ein Lager anlegen und in der Übersicht sehen.
test('Lager anlegen', async ({ page }) => {
  const state = emptyState();
  state.depots = [];
  await mockApi(page, state);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Jurtenburg' })).toBeVisible();

  await page.getByPlaceholder(/Neues Lager/).fill('Stamm Grauer Reiter');
  await page.getByRole('button', { name: 'Anlegen' }).click();

  await expect(page.getByText('Stamm Grauer Reiter')).toBeVisible();
});
