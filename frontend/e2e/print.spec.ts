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
  // Details des Gegenstands (Kategorie) sind sichtbar …
  await expect(printPage.getByText('Zeltteil')).toBeVisible();
  // … und die offenen Mängel der Kiste stehen mit auf dem Zettel.
  await expect(printPage.getByRole('heading', { name: /Offene Mängel/ })).toBeVisible();
  await expect(printPage.getByText('Loch in Seitenplane')).toBeVisible();
  await expect(printPage.getByRole('button', { name: /Drucken/ })).toBeVisible();
});

// Use-Case: Bestandsliste drucken — Details je Gegenstand und offene Mängel je Ort.
test('Bestand drucken', async ({ page }) => {
  await openSeededDepot(page);

  const [printPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: /Bestand/ }).click(),
  ]);

  await expect(printPage.getByRole('heading', { name: /Bestandsliste/ })).toBeVisible();
  // Ein Gegenstand mit Detail-Notiz (Hammer, Notiz „Stiel …").
  await expect(printPage.getByText('Hammer', { exact: true })).toBeVisible();
  await expect(printPage.getByText(/Stiel leicht angerissen/)).toBeVisible();
  // Offene Mängel erscheinen bei ihrem Ort.
  await expect(printPage.getByText('Loch in Seitenplane')).toBeVisible();
  await expect(printPage.getByRole('button', { name: /Drucken/ })).toBeVisible();
});
