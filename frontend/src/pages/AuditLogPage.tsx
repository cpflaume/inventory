import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AuditAction, AuditLogView, AuditQuery } from '../api/types';
import { Button, Card, EmptyState } from '../components/ui';

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login fehlgeschlagen',
  CREATE: 'Angelegt',
  UPDATE: 'Geändert',
  DELETE: 'Gelöscht',
};

const ACTION_STYLES: Record<AuditAction, string> = {
  LOGIN: 'bg-moos-100 text-moos-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  CREATE: 'bg-moos-100 text-moos-700',
  UPDATE: 'bg-lagerfeuer-400/20 text-lagerfeuer-600',
  DELETE: 'bg-red-100 text-red-700',
};

function ActionBadge({ action }: { action: AuditAction }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_STYLES[action]}`}>
      {ACTION_LABELS[action]}
    </span>
  );
}

/** Statuscode: 2xx grün, 4xx/5xx rot, sonst neutral. */
function statusColor(code?: number | null) {
  if (code == null) return 'text-moos-400';
  if (code >= 200 && code < 300) return 'text-moos-600';
  if (code >= 400) return 'text-red-600';
  return 'text-moos-500';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface FilterState {
  action: AuditAction | '';
  actor: string;
  q: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: FilterState = { action: '', actor: '', q: '', from: '', to: '' };

/** datetime-local (lokale Zeit, ohne Zone) → ISO-Instant mit Zone fürs Backend. */
function toInstant(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<AuditQuery>({ page: 0, size: PAGE_SIZE });

  const query = useQuery({
    queryKey: ['audit-logs', applied],
    queryFn: () => api.auditLogs(applied),
    placeholderData: (prev) => prev,
  });

  const apply = () =>
    setApplied({
      action: filters.action || undefined,
      actor: filters.actor.trim() || undefined,
      q: filters.q.trim() || undefined,
      from: toInstant(filters.from),
      to: toInstant(filters.to),
      page: 0,
      size: PAGE_SIZE,
    });

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setApplied({ page: 0, size: PAGE_SIZE });
  };

  const goToPage = (page: number) => setApplied((a) => ({ ...a, page }));

  const data = query.data;
  const page = data?.page ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const entries = data?.content ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-moos-800">📜 Audit-Log</h1>
        <Link to="/admin" className="text-sm font-semibold text-moos-700 underline">
          ← Zur Admin-Konsole
        </Link>
      </div>
      <p className="text-sm text-moos-500">
        Nachvollziehbar: wer sich anmeldet und wer wann etwas anlegt, ändert oder löscht.
      </p>

      <Card className="p-4">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-semibold text-moos-600">
            Aktion
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value as AuditAction | '' }))}
              className="rounded-xl border border-moos-200 px-3 py-2 text-sm font-normal"
            >
              <option value="">Alle</option>
              {(Object.keys(ACTION_LABELS) as AuditAction[]).map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-moos-600">
            Benutzer
            <input
              value={filters.actor}
              onChange={(e) => setFilters((f) => ({ ...f, actor: e.target.value }))}
              placeholder="E-Mail / Benutzername"
              className="rounded-xl border border-moos-200 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-moos-600">
            Pfad enthält
            <input
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="z.B. /api/depots"
              className="rounded-xl border border-moos-200 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-moos-600">
            Von
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="rounded-xl border border-moos-200 px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-moos-600">
            Bis
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="rounded-xl border border-moos-200 px-3 py-2 text-sm font-normal"
            />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Filtern</Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Zurücksetzen
            </Button>
          </div>
        </form>
      </Card>

      {query.isError && (
        <p className="text-sm text-red-600">{(query.error as Error).message}</p>
      )}

      {entries.length === 0 && !query.isLoading ? (
        <EmptyState emoji="📭" title="Keine Einträge" hint="Für diese Filter gibt es nichts zu zeigen." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-moos-50 text-xs uppercase tracking-wide text-moos-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Zeitpunkt</th>
                  <th className="px-4 py-2 font-semibold">Aktion</th>
                  <th className="px-4 py-2 font-semibold">Benutzer</th>
                  <th className="px-4 py-2 font-semibold">Operation</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <AuditRow key={e.id} entry={e} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm text-moos-600">
        <span>
          {data ? `${data.totalElements} Einträge` : query.isLoading ? 'Lade …' : ''}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" disabled={page <= 0} onClick={() => goToPage(page - 1)}>
              ← Zurück
            </Button>
            <span className="text-xs">
              Seite {page + 1} / {totalPages}
            </span>
            <Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => goToPage(page + 1)}>
              Weiter →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditLogView }) {
  return (
    <tr className="border-t border-moos-100 align-top">
      <td className="whitespace-nowrap px-4 py-2 text-moos-600">{formatTime(entry.occurredAt)}</td>
      <td className="px-4 py-2">
        <ActionBadge action={entry.action} />
      </td>
      <td className="px-4 py-2 text-moos-700">{entry.actorUsername || <span className="text-moos-400">—</span>}</td>
      <td className="px-4 py-2">
        {entry.method && (
          <span className="mr-1 rounded bg-moos-50 px-1.5 py-0.5 font-mono text-xs text-moos-600">
            {entry.method}
          </span>
        )}
        <span className="break-all font-mono text-xs text-moos-500">{entry.path}</span>
      </td>
      <td className={`px-4 py-2 font-mono text-xs ${statusColor(entry.statusCode)}`}>
        {entry.statusCode ?? '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-moos-400">{entry.ipAddress || '—'}</td>
    </tr>
  );
}
