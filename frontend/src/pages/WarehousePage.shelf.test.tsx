import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WarehousePage from './WarehousePage';
import type { WarehouseView } from '../api/types';

const warehouse: WarehouseView = {
  shelves: [{ id: 's1', label: 'Regal A', gridRows: 2, gridCols: 2, cells: [] }],
  freestandingBoxes: [],
  unassignedItems: [],
};

const deleteLocation = vi.fn(() => Promise.resolve());

vi.mock('../api/client', () => ({
  api: {
    warehouse: () => Promise.resolve(warehouse),
    getDepot: () => Promise.resolve({ id: 'd1', name: 'Test', createdAt: '' }),
    deleteLocation: (...args: unknown[]) => deleteLocation(...(args as [])),
  },
  getToken: () => null,
  setToken: () => {},
  clearToken: () => {},
  setUnauthorizedHandler: () => {},
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ canEdit: () => true, isAdmin: true, roleForDepot: () => 'ADMIN' }),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/lager/d1']}>
        <Routes>
          <Route path="/lager/:depotId" element={<WarehousePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('WarehousePage — Regal löschen (Admin)', () => {
  it('öffnet die Regal-Detailsicht und löscht das Regal nach Bestätigung', async () => {
    renderPage();

    // Namensschild des Regals öffnet die Detailsicht.
    await userEvent.click(await screen.findByRole('button', { name: /Regal A/ }));
    // Löschen anstoßen und bestätigen.
    await userEvent.click(screen.getByRole('button', { name: /Regal löschen/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Löschen$/ }));

    expect(deleteLocation).toHaveBeenCalledWith('d1', 's1');
  });
});
