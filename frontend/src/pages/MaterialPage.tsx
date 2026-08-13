import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ItemInput } from '../api/client';
import type { ConditionFlag } from '../api/types';
import { Button, Card, ConditionDot, EmptyState } from '../components/ui';

const empty: ItemInput = { name: '', category: '', quantity: 1, conditionFlag: 'GREEN' };

export default function MaterialPage() {
  const { depotId = '' } = useParams();
  const qc = useQueryClient();
  const [form, setForm] = useState<ItemInput>(empty);

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
      setForm(empty);
      qc.invalidateQueries({ queryKey: ['items', depotId] });
      qc.invalidateQueries({ queryKey: ['warehouse', depotId] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-moos-800">🎒 Material</h1>

      <Card className="space-y-3 p-4">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Was? (z.B. Hammer, Jurtendach)"
          className="w-full rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500"
        />
        <div className="flex flex-wrap gap-2">
          <input
            value={form.category ?? ''}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Kategorie"
            className="min-w-0 flex-1 rounded-xl border border-moos-200 px-4 py-2"
          />
          <input
            type="number"
            min={0}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            className="w-20 rounded-xl border border-moos-200 px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={form.conditionFlag}
            onChange={(e) => setForm({ ...form, conditionFlag: e.target.value as ConditionFlag })}
            className="rounded-xl border border-moos-200 px-3 py-2"
          >
            <option value="GREEN">🟢 einsatzbereit</option>
            <option value="YELLOW">🟡 kleine Macke</option>
            <option value="RED">🔴 defekt</option>
          </select>
          <select
            value={form.locationId ?? ''}
            onChange={(e) => setForm({ ...form, locationId: e.target.value || null })}
            className="min-w-0 flex-1 rounded-xl border border-moos-200 px-3 py-2"
          >
            <option value="">In welche Kiste? (optional)</option>
            {boxes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <input
          value={form.note ?? ''}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Notiz (optional)"
          className="w-full rounded-xl border border-moos-200 px-4 py-2"
        />
        {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
        <div className="flex justify-end">
          <Button onClick={() => create.mutate()} disabled={!form.name.trim() || create.isPending}>
            + Hinzufügen
          </Button>
        </div>
      </Card>

      {items.data && items.data.length === 0 && (
        <EmptyState emoji="🎒" title="Noch kein Material" hint="Füg oben das erste Teil hinzu." />
      )}
      <div className="grid gap-2">
        {items.data?.map((it) => (
          <Card key={it.id} className="flex items-center gap-3 p-3">
            <ConditionDot flag={it.conditionFlag} />
            <div className="flex-1">
              <p className="font-medium text-moos-800">{it.name}</p>
              {(it.category || it.note) && (
                <p className="text-xs text-moos-500">
                  {it.category}
                  {it.category && it.note ? ' · ' : ''}
                  {it.note}
                </p>
              )}
            </div>
            <span className="text-sm text-moos-400">×{it.quantity}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
