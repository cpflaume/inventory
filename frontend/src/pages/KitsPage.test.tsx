import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import KitsPage from './KitsPage';
import type { Kit } from '../api/types';

const kit: Kit = {
  id: 'k1',
  name: 'Bausatz Kothe',
  description: 'Schwarzzelt',
  positions: [
    { id: 'p1', label: 'Kothenbahnen', targetQuantity: 4 },
    { id: 'p2', label: 'Heringe', targetQuantity: 20 },
  ],
};

const instantiateKit = vi.fn(() =>
  Promise.resolve({ boxId: 'b9', boxLabel: 'Kothe – Neu', itemCount: 2 }),
);

vi.mock('../api/client', () => ({
  api: {
    listKits: () => Promise.resolve([kit]),
    instantiateKit: (...args: unknown[]) => instantiateKit(...(args as [])),
  },
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ canEdit: () => true }),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/lager/d1/bausaetze']}>
        <Routes>
          <Route path="/lager/:depotId/bausaetze" element={<KitsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KitsPage — Bausatz ins Lager übernehmen', () => {
  it('legt über den Dialog eine neue Kiste mit allen Positionen an', async () => {
    renderPage();

    // Der Übernahme-Button erscheint (Editor-Recht) …
    const button = await screen.findByRole('button', { name: /Ins Lager übernehmen/ });
    await userEvent.click(button);

    // Dialog erklärt, was passiert, und schlägt den Bausatz-Namen als Kistennamen vor.
    expect(screen.getByText(/Bestehende Gegenstände bleiben unverändert/)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Kothe/);
    expect(input).toHaveValue('Bausatz Kothe');

    await userEvent.click(screen.getByRole('button', { name: /Kiste anlegen/ }));

    // Erfolgsmeldung mit Kistenname und Anzahl.
    expect(await screen.findByText(/Kothe – Neu/)).toBeInTheDocument();
    expect(screen.getByText(/2 Gegenständen angelegt/)).toBeInTheDocument();
    expect(instantiateKit).toHaveBeenCalledWith('d1', 'k1', 'Bausatz Kothe');
  });
});
