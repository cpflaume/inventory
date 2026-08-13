import { expect, test } from '@playwright/test';
import { emptyState, mockApi } from './mocks';

// Use-Case: Beipackzettel einer Kiste als Druckansicht öffnen.
test('Beipackzettel drucken', async ({ page }) => {
  const state = emptyState();
  state.contents = {
    b1: {
      locationId: 'b1',
      label: 'Kiste 1 · Dach',
      items: [{ id: 'i2', name: 'Jurtendach', quantity: 1, conditionFlag: 'GREEN', note: 'oben lagern' }],
    },
  };
  await mockApi(page, state);

  await page.goto('/lager/d1/druck/kiste/b1');

  await expect(page.getByRole('heading', { name: /Kiste 1 · Dach/ })).toBeVisible();
  await expect(page.getByText('Beipackzettel')).toBeVisible();
  await expect(page.getByText('Jurtendach')).toBeVisible();
  await expect(page.getByRole('button', { name: /Drucken/ })).toBeVisible();
});
