import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ItemDialog } from './items';
import type { DefectReport, Item, Location } from '../api/types';

const item: Item = {
  id: 'i1',
  name: 'Jurtendach',
  category: 'Zelt',
  quantity: 2,
  conditionFlag: 'YELLOW',
  note: 'Naht prüfen',
  locationId: 'b1',
};

const items: Item[] = [
  item,
  { id: 'i2', name: 'Zeltnagel', category: 'Kleinteil', quantity: 40, conditionFlag: 'GREEN' },
];

const boxes: Location[] = [{ id: 'b1', type: 'BOX', label: 'Kiste 1' }];
const defects: DefectReport[] = [
  {
    id: 'd1',
    itemId: 'i1',
    title: 'Loch in der Plane',
    severity: 'DEFEKT',
    status: 'OPEN',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

vi.mock('../api/client', () => ({
  api: {
    listLocations: () => Promise.resolve(boxes),
    listDefects: () => Promise.resolve(defects),
    listItems: () => Promise.resolve(items),
  },
}));

function renderDialog(canEdit: boolean) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ItemDialog depotId="d1" item={item} canEdit={canEdit} onClose={() => {}} />
    </QueryClientProvider>,
  );
}

describe('ItemDialog (Gegenstand-Detail)', () => {
  it('zeigt Detail inkl. Lagerort und zugehörigem Mangel', async () => {
    renderDialog(false);

    expect(screen.getAllByText('Jurtendach').length).toBeGreaterThan(0);
    expect(screen.getByText('Naht prüfen')).toBeInTheDocument();
    // Lagerort wird aufgelöst (Kiste), Mangel erscheint in der Detailsicht.
    expect(await screen.findByText('📦 Kiste 1')).toBeInTheDocument();
    expect(await screen.findByText('Loch in der Plane')).toBeInTheDocument();
  });

  it('blendet Bearbeiten/Löschen ohne Editor-Recht aus', () => {
    renderDialog(false);
    expect(screen.queryByRole('button', { name: /Bearbeiten/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Löschen/ })).not.toBeInTheDocument();
  });

  it('zeigt Bearbeiten/Löschen mit Editor-Recht', () => {
    renderDialog(true);
    expect(screen.getByRole('button', { name: /Bearbeiten/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Löschen/ })).toBeInTheDocument();
  });

  it('bietet vorhandene Kategorien als Dropdown-Vorschläge beim Bearbeiten', async () => {
    renderDialog(true);
    await userEvent.click(screen.getByRole('button', { name: /Bearbeiten/ }));

    const input = await screen.findByPlaceholderText('Kategorie');
    const listId = input.getAttribute('list');
    expect(listId).toBeTruthy();
    const datalist = document.getElementById(listId!);
    expect(datalist?.querySelector('option[value="Zelt"]')).toBeTruthy();
    expect(datalist?.querySelector('option[value="Kleinteil"]')).toBeTruthy();
  });
});
