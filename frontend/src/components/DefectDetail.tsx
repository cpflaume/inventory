import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { DefectReport, Item } from '../api/types';
import { Button, Modal } from './ui';
import { ItemDialog, ItemRow } from './items';

const SEVERITY = { MACKE: { icon: '🩹', label: 'Macke' }, DEFEKT: { icon: '💥', label: 'Defekt' } } as const;

function Value({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-moos-500">{label}</p>
      <p className="text-moos-800">{children}</p>
    </div>
  );
}

/**
 * Detailsicht einer Mängelmeldung inkl. betroffenem Gegenstand (anklickbar →
 * Gegenstand-Detail) und ggf. Lagerort. `canEdit` schaltet „Erledigt" frei.
 */
export function DefectDetailDialog({
  depotId,
  defect,
  canEdit,
  onClose,
}: {
  depotId: string;
  defect: DefectReport;
  canEdit: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [showItem, setShowItem] = useState<Item | null>(null);

  const items = useQuery({
    queryKey: ['items', depotId],
    queryFn: () => api.listItems(depotId),
    enabled: !!defect.itemId,
  });
  const locations = useQuery({
    queryKey: ['locations', depotId],
    queryFn: () => api.listLocations(depotId),
    enabled: !!defect.locationId,
  });

  const item = items.data?.find((i) => i.id === defect.itemId) ?? null;
  const location = locations.data?.find((l) => l.id === defect.locationId) ?? null;

  const resolve = useMutation({
    mutationFn: () => api.resolveDefect(depotId, defect.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['defects', depotId] });
      qc.invalidateQueries({ queryKey: ['warehouse', depotId] });
      onClose();
    },
  });

  const sev = SEVERITY[defect.severity];
  const footer =
    canEdit && defect.status === 'OPEN' ? (
      <div className="flex justify-end">
        <Button onClick={() => resolve.mutate()} disabled={resolve.isPending}>
          ✅ Als erledigt markieren
        </Button>
      </div>
    ) : undefined;

  return (
    <Modal title={`${sev.icon} ${defect.title}`} onClose={onClose} footer={footer}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Value label="Schwere">{sev.label}</Value>
          <Value label="Status">{defect.status === 'OPEN' ? 'offen' : 'erledigt'}</Value>
          {defect.reporter && <Value label="Gemeldet von">{defect.reporter}</Value>}
          <Value label="Gemeldet am">{new Date(defect.createdAt).toLocaleDateString('de-DE')}</Value>
        </div>

        {defect.description && <Value label="Beschreibung">{defect.description}</Value>}

        {defect.itemId && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-moos-500">
              Betroffener Gegenstand
            </p>
            {item ? (
              <div className="rounded-lg ring-1 ring-moos-100">
                <ItemRow item={item} onClick={() => setShowItem(item)} />
              </div>
            ) : (
              <p className="text-sm text-moos-400">Gegenstand nicht mehr vorhanden.</p>
            )}
          </div>
        )}

        {location && <Value label="Betroffener Lagerort">{location.label}</Value>}
      </div>

      {showItem && (
        <ItemDialog depotId={depotId} item={showItem} canEdit={canEdit} onClose={() => setShowItem(null)} />
      )}
    </Modal>
  );
}
