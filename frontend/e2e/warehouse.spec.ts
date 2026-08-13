import { expect, test } from '@playwright/test';
import { emptyState, mockApi } from './mocks';

// Use-Case: virtuelles Lager ansehen — Regal-Raster, Kisten, freistehende Kisten,
// Kiste öffnen und Inhalt sehen.
test('Virtuelles Lager: Regal, Kisten und Kisteninhalt', async ({ page }) => {
  const state = emptyState();
  state.warehouse = {
    shelves: [
      {
        id: 's1',
        label: 'Regal A',
        gridRows: 2,
        gridCols: 2,
        cells: [
          {
            row: 0,
            col: 0,
            box: { id: 'b1', label: 'Kiste 1 · Dach', itemCount: 2, openDefects: 1 },
            looseItems: [],
          },
        ],
      },
    ],
    freestandingBoxes: [{ id: 'b2', label: 'Kiste 5 · Heringe', itemCount: 40, openDefects: 0 }],
    unassignedItems: [{ id: 'i1', name: 'Hammer', quantity: 1, conditionFlag: 'YELLOW' }],
  };
  state.contents = {
    b1: {
      locationId: 'b1',
      label: 'Kiste 1 · Dach',
      items: [{ id: 'i2', name: 'Jurtendach', quantity: 1, conditionFlag: 'GREEN' }],
    },
  };
  await mockApi(page, state);

  await page.goto('/lager/d1');

  await expect(page.getByText('🪵 Regal A')).toBeVisible();
  await expect(page.getByText('2 × 2 Fächer')).toBeVisible();
  await expect(page.getByText('Kiste 1 · Dach')).toBeVisible();
  await expect(page.getByText('Freistehende Kisten')).toBeVisible();
  await expect(page.getByText('Kiste 5 · Heringe')).toBeVisible();
  await expect(page.getByText('Hammer')).toBeVisible();

  // Kiste öffnen → Inhalt (Beipackzettel-Vorschau) erscheint.
  await page.getByRole('button', { name: /Kiste 1 · Dach/ }).click();
  await expect(page.getByText('Jurtendach')).toBeVisible();
  await expect(page.getByRole('link', { name: /Beipackzettel drucken/ })).toBeVisible();
});
