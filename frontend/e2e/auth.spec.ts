import { expect, test } from '@playwright/test';

// Diese Specs laufen ohne den Admin-Login (leerer storageState).
test.use({ storageState: { cookies: [], origins: [] } });

test('Nicht angemeldet → Login-Seite', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
});

test('Registrierung zeigt Freigabe-Hinweis', async ({ page }) => {
  await page.goto('/register');
  await page.getByPlaceholder('Benutzername').fill(`e2e-${Date.now()}`);
  await page.getByPlaceholder(/Passwort/).fill('Passwort1');
  await page.getByRole('button', { name: 'Konto anlegen' }).click();
  await expect(page.getByText(/Freigabe durch einen Admin/)).toBeVisible();
});

test('Login als Gruppenmitglied sieht sein Lager (Mandantenfähigkeit)', async ({ page }) => {
  // 'max' ist geseedet: aktiv, Mitglied einer Gruppe mit EDITOR-Zugriff auf das Demo-Lager.
  await page.goto('/login');
  await page.getByPlaceholder('Benutzername').fill('max');
  await page.getByPlaceholder('Passwort').fill('max12345');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText('Stamm Grauer Reiter')).toBeVisible();
});
