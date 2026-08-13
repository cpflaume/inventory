import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WarehousePage from './WarehousePage';
import type { WarehouseView } from '../api/types';

const warehouse: WarehouseView = {
  shelves: [
    {
      id: 's1',
      label: 'Regal A',
      gridRows: 2,
      gridCols: 2,
      cells: [
        { row: 0, col: 0, box: { id: 'b1', label: 'Kiste 1 · Dach', itemCount: 3, openDefects: 1 }, looseItems: [] },
      ],
    },
  ],
  freestandingBoxes: [{ id: 'b2', label: 'Kiste 5 · Heringe', itemCount: 40, openDefects: 0 }],
  unassignedItems: [],
};

vi.mock('../api/client', () => ({
  api: {
    warehouse: () => Promise.resolve(warehouse),
    getDepot: () => Promise.resolve({ id: 'd1', name: 'Test', createdAt: '' }),
  },
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

describe('WarehousePage (virtuelles Lager)', () => {
  it('rendert Regal, Kiste im Fach und freistehende Kiste', async () => {
    renderPage();

    // Regal-Titel und Rastergröße.
    expect(await screen.findByText('🪵 Regal A')).toBeInTheDocument();
    expect(screen.getByText('2 × 2 Fächer')).toBeInTheDocument();

    // Kiste im Fach mit immer sichtbarer Bezeichnung.
    expect(screen.getByText('Kiste 1 · Dach')).toBeInTheDocument();

    // Freistehende Kiste erscheint separat.
    expect(screen.getByText('Freistehende Kisten')).toBeInTheDocument();
    expect(screen.getByText('Kiste 5 · Heringe')).toBeInTheDocument();
  });
});
