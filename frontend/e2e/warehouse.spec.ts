import { expect, test } from '@playwright/test';
import { openSeededDepot } from './helpers';

// Use-Case: virtuelles Lager ansehen — Regal, Kisten im Fach, freistehende Kiste,
// Kiste öffnen und Inhalt sehen (alles aus dem Backend-Seed).
test('Virtuelles Lager: Regal, Kisten und Kisteninhalt', async ({ page }) => {
  await openSeededDepot(page);

  await expect(page.getByText('🪵 Regal A')).toBeVisible();
  await expect(page.getByText('Kiste 1 · Jurtendach')).toBeVisible();
  await expect(page.getByText('Freistehende Kisten')).toBeVisible();
  await expect(page.getByText('Kiste 5 · Heringe & Abspanner')).toBeVisible();

  // Kiste öffnen → Inhalt erscheint.
  await page.getByRole('button', { name: /Kiste 1 · Jurtendach/ }).click();
  // exact:true, damit nicht auch die Kisten-Kachel „Kiste 1 · Jurtendach" matcht.
  await expect(page.getByText('Jurtendach', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Beipackzettel drucken/ })).toBeVisible();
});
