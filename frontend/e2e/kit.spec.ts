import { expect, test } from '@playwright/test';
import { openSeededDepot } from './helpers';

// Use-Case: Bausatz als neue Kiste ins Lager übernehmen (alle Positionen als neue Gegenstände).
test('Bausatz ins Lager übernehmen', async ({ page }) => {
  await openSeededDepot(page);
  await page.getByRole('link', { name: /Bausätze/ }).click();

  // Beide geseedeten Bausätze sind sichtbar (inkl. des zweiten für die Kothe).
  await expect(page.getByText('Bausatz Jurte 8m')).toBeVisible();
  await expect(page.getByText('Bausatz Kothe')).toBeVisible();

  // In der Kothe-Karte „Ins Lager übernehmen" öffnen.
  const kotheCard = page.locator('div.rounded-2xl').filter({ hasText: 'Bausatz Kothe' });
  await kotheCard.getByRole('button', { name: /Ins Lager übernehmen/ }).click();

  // Dialog: Kiste benennen und anlegen.
  await expect(page.getByRole('heading', { name: /Bausatz Kothe.*ins Lager übernehmen/ })).toBeVisible();
  const input = page.getByRole('textbox');
  await input.fill('Kothe – E2E');
  await page.getByRole('button', { name: /Kiste anlegen/ }).click();

  // Erfolgsmeldung, dann Dialog schließen.
  await expect(page.getByText(/Kothe – E2E/)).toBeVisible();
  await expect(page.getByText(/angelegt/)).toBeVisible();
  await page.getByRole('button', { name: /Fertig/ }).click();

  // Die neue Kiste erscheint als freistehende Kiste im virtuellen Lager.
  // Zur Lager-Ansicht über den unteren Tab (der Header-Link „Zurück zur Lager-Auswahl"
  // träfe /Lager/ ebenfalls, daher auf die Navigationsleiste eingrenzen).
  await page.locator('nav').getByRole('link', { name: /Lager/ }).click();
  await expect(page.getByRole('heading', { name: /Virtuelles Lager/ })).toBeVisible();
  await expect(page.getByText('Kothe – E2E')).toBeVisible();
});
