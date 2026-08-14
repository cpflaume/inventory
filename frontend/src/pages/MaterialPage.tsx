import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ItemInput } from '../api/client';
import type { Item } from '../api/types';
import { Button, Card, EmptyState } from '../components/ui';
import { ItemDialog, ItemForm, ItemRow } from '../components/items';
import { emptyItem } from '../components/itemModel';
import { type LocationTarget, targetPatch } from '../components/locationTarget';
import { useAuth } from '../auth/AuthContext';

export default function MaterialPage() {
  const { depotId = '' } = useParams();
  const qc = useQueryClient();
  const { canEdit: canEditFn } = useAuth();
  const canEdit = canEditFn(depotId);

  // Aus dem Lager-View „Neu anlegen" kommt der vorgewählte Lagerort per Router-State.
  const { state } = useLocation();
  const initialTarget = (state as { target?: LocationTarget } | null)?.target ?? null;
  const [fixedTarget, setFixedTarget] = useState<LocationTarget | null>(initialTarget);
  const [form, setForm] = useState<ItemInput>(() =>
    initialTarget ? { ...emptyItem, ...targetPatch(initialTarget) } : emptyItem,
  );
  const [detailItem, setDetailItem] = useState<Item | null>(null);

  const items = useQuery({ queryKey: ['items', depotId], queryFn: () => api.listItems(depotId) });
  const locations = useQuery({
    queryKey: ['locations', depotId],
    queryFn: () => api.listLocations(depotId),
  });
  const boxes = locations.data?.filter((l) => l.type === 'BOX') ?? [];

  const create = useMutation({
    mutationFn: () =>
      api.createItem(depotId, {
        ...form,
        category: form.category?.trim() || undefined,
        note: form.note?.trim() || undefined,
      }),
    onSuccess: () => {
      // Bei festem Lagerort für Folge-Anlagen beibehalten.
      setForm(fixedTarget ? { ...emptyItem, ...targetPatch(fixedTarget) } : emptyItem);
      qc.invalidateQueries({ queryKey: ['items', depotId] });
      qc.invalidateQueries({ queryKey: ['warehouse', depotId] });
    },
  });

  const clearTarget = () => {
    setFixedTarget(null);
    setForm({ ...form, locationId: null, row: null, col: null });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-moos-800">🎒 Material</h1>

      {canEdit && (
        <Card className="space-y-3 p-4">
          <ItemForm
            value={form}
            onChange={setForm}
            boxes={boxes}
            fixedTarget={fixedTarget}
            onClearTarget={fixedTarget ? clearTarget : undefined}
          />
          {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
          <div className="flex justify-end">
            <Button onClick={() => create.mutate()} disabled={!form.name.trim() || create.isPending}>
              + Hinzufügen
            </Button>
          </div>
        </Card>
      )}

      {items.data && items.data.length === 0 && (
        <EmptyState emoji="🎒" title="Noch kein Material" hint="Füg oben das erste Teil hinzu." />
      )}
      {items.data && items.data.length > 0 && (
        <Card className="divide-y divide-moos-50 p-2">
          {items.data.map((it) => (
            <ItemRow key={it.id} item={it} onClick={() => setDetailItem(it)} />
          ))}
        </Card>
      )}

      {detailItem && (
        <ItemDialog
          depotId={depotId}
          item={detailItem}
          canEdit={canEdit}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}
