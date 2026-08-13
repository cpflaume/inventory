import { expect, test } from '@playwright/test';
import { emptyState, mockApi } from './mocks';

// Use-Case: Material hinzufügen und in der Liste sehen.
test('Material hinzufügen', async ({ page }) => {
  await mockApi(page, emptyState());

  await page.goto('/lager/d1/material');
  await expect(page.getByRole('heading', { name: /Material/ })).toBeVisible();

  await page.getByPlaceholder(/Was\?/).fill('Hammer');
  await page.getByRole('button', { name: '+ Hinzufügen' }).click();

  await expect(page.getByText('Hammer')).toBeVisible();
});
