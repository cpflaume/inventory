import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Severity } from '../api/types';
import { Button, Card, EmptyState } from '../components/ui';

export default function DefectReportPage() {
  const { depotId = '' } = useParams();
  const qc = useQueryClient();
  const [severity, setSeverity] = useState<Severity>('MACKE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemId, setItemId] = useState('');

  const items = useQuery({ queryKey: ['items', depotId], queryFn: () => api.listItems(depotId) });
  const reports = useQuery({
    queryKey: ['defects', depotId],
    queryFn: () => api.listDefects(depotId),
  });

  const create = useMutation({
    mutationFn: () =>
      api.createDefect(depotId, {
        title,
        description,
        severity,
        itemId: itemId || null,
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setItemId('');
      setSeverity('MACKE');
      qc.invalidateQueries({ queryKey: ['defects', depotId] });
      qc.invalidateQueries({ queryKey: ['warehouse', depotId] });
    },
  });

  const resolve = useMutation({
    mutationFn: (id: string) => api.resolveDefect(depotId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['defects', depotId] }),
  });

  const open = reports.data?.filter((r) => r.status === 'OPEN') ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-moos-800">🐛 Mängelmeldung</h1>

      {/* Mobil: große, daumenfreundliche Kurzform. */}
      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <SeverityButton active={severity === 'MACKE'} onClick={() => setSeverity('MACKE')} emoji="🩹" label="Macke" />
          <SeverityButton active={severity === 'DEFEKT'} onClick={() => setSeverity('DEFEKT')} emoji="💥" label="Defekt" />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Was ist kaputt? (z.B. Loch in Seitenplane)"
          className="w-full rounded-xl border border-moos-200 px-4 py-3 text-lg outline-none focus:border-moos-500"
        />
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="w-full rounded-xl border border-moos-200 px-3 py-2"
        >
          <option value="">Betroffenes Teil (optional)</option>
          {items.data?.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details (optional)"
          rows={2}
          className="w-full rounded-xl border border-moos-200 px-4 py-2"
        />
        {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
        <Button variant="fire" onClick={() => create.mutate()} disabled={!title.trim() || create.isPending}>
          Mangel melden
        </Button>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-moos-500">
          Offene Mängel ({open.length})
        </h2>
        {open.length === 0 && <EmptyState emoji="✅" title="Alles heil" hint="Keine offenen Mängel." />}
        <div className="grid gap-2">
          {open.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-3">
              <span className="text-xl">{r.severity === 'DEFEKT' ? '💥' : '🩹'}</span>
              <div className="flex-1">
                <p className="font-medium text-moos-800">{r.title}</p>
                {r.description && <p className="text-xs text-moos-500">{r.description}</p>}
              </div>
              <Button variant="ghost" onClick={() => resolve.mutate(r.id)} disabled={resolve.isPending}>
                Erledigt
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function SeverityButton({
  active,
  onClick,
  emoji,
  label,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-sm font-semibold transition ${
        active
          ? 'border-lagerfeuer-500 bg-lagerfeuer-400/10 text-lagerfeuer-600'
          : 'border-moos-100 text-moos-400'
      }`}
    >
      <span className="text-3xl">{emoji}</span>
      {label}
    </button>
  );
}
