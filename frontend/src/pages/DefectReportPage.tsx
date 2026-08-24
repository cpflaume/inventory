import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { DefectReport, Severity } from '../api/types';
import { Button, Card, EmptyState } from '../components/ui';
import { DefectDetailDialog } from '../components/DefectDetail';
import { useAuth } from '../auth/AuthContext';

export default function DefectReportPage() {
  const { depotId = '' } = useParams();
  const qc = useQueryClient();
  const { canEdit: canEditFn } = useAuth();
  const canEdit = canEditFn(depotId);
  const [severity, setSeverity] = useState<Severity>('MACKE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemId, setItemId] = useState('');
  const [detail, setDetail] = useState<DefectReport | null>(null);

  const items = useQuery({ queryKey: ['items', depotId], queryFn: () => api.listItems(depotId) });
  const reports = useQuery({
    queryKey: ['defects', depotId],
    queryFn: () => api.listDefects(depotId),
  });

  const create = useMutation({
    mutationFn: () =>
      api.createDefect(depotId, {
        title: title.trim(),
        description: description.trim() || undefined,
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
      // Ein Mangel am Teil zieht dessen Ampel nach — Item-Listen neu laden.
      qc.invalidateQueries({ queryKey: ['items', depotId] });
    },
  });

  const resolve = useMutation({
    mutationFn: (id: string) => api.resolveDefect(depotId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['defects', depotId] }),
  });

  const open = reports.data?.filter((r) => r.status === 'OPEN') ?? [];
  const resolved = reports.data?.filter((r) => r.status === 'RESOLVED') ?? [];

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
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
            <DefectRow
              key={r.id}
              report={r}
              onOpen={() => setDetail(r)}
              onResolve={canEdit ? () => resolve.mutate(r.id) : undefined}
              resolving={resolve.isPending}
            />
          ))}
        </div>
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Erledigte Mängel ({resolved.length})
          </h2>
          <div className="grid gap-2">
            {resolved.map((r) => (
              <DefectRow key={r.id} report={r} resolved onOpen={() => setDetail(r)} />
            ))}
          </div>
        </section>
      )}

      {detail && (
        <DefectDetailDialog
          depotId={depotId}
          defect={detail}
          canEdit={canEdit}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

/**
 * Ein Mängel-Eintrag in der Liste. `resolved` graut den Eintrag aus (bleibt
 * aber klickbar). `min-w-0` + `truncate` verhindern, dass lange Titel oder der
 * „Erledigt"-Button die Karte über die Bildschirmbreite hinausschieben.
 */
function DefectRow({
  report,
  resolved = false,
  onOpen,
  onResolve,
  resolving,
}: {
  report: DefectReport;
  resolved?: boolean;
  onOpen: () => void;
  onResolve?: () => void;
  resolving?: boolean;
}) {
  return (
    <Card className={`flex min-w-0 items-center gap-3 p-3 ${resolved ? 'bg-gray-50 ring-gray-100' : ''}`}>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className={`text-xl ${resolved ? 'grayscale' : ''}`}>
          {report.severity === 'DEFEKT' ? '💥' : '🩹'}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-medium ${resolved ? 'text-gray-400 line-through' : 'text-moos-800'}`}
          >
            {report.title}
          </span>
          {report.description && (
            <span className={`block truncate text-xs ${resolved ? 'text-gray-300' : 'text-moos-500'}`}>
              {report.description}
            </span>
          )}
        </span>
      </button>
      {resolved ? (
        <span className="shrink-0 text-xs font-semibold text-gray-400">✓ erledigt</span>
      ) : (
        onResolve && (
          <div className="shrink-0">
            <Button variant="ghost" onClick={onResolve} disabled={resolving}>
              erledigen
            </Button>
          </div>
        )
      )}
    </Card>
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
