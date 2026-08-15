import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AppVersion, Button, Card, EmptyState, inputClass } from '../components/ui';
import type { Depot } from '../api/types';

export default function DepotListPage() {
  const qc = useQueryClient();
  const { user, isAdmin, logout } = useAuth();
  const [name, setName] = useState('');
  const { data: depots, isLoading } = useQuery({ queryKey: ['depots'], queryFn: api.listDepots });

  const create = useMutation({
    mutationFn: () => api.createDepot({ name }),
    onSuccess: () => {
      setName('');
      qc.invalidateQueries({ queryKey: ['depots'] });
    },
  });

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between text-sm">
        <span className="text-moos-600">
          Angemeldet als <span className="font-semibold">{user?.displayName || user?.username}</span>
        </span>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" className="font-semibold text-moos-700 underline">
              🛠️ Admin
            </Link>
          )}
          <button onClick={logout} className="text-moos-500 hover:underline">
            Abmelden
          </button>
        </div>
      </div>

      <div className="mb-8 text-center">
        <div className="text-5xl">⛺</div>
        <h1 className="mt-2 text-3xl font-bold text-moos-800">Jurtenburg</h1>
        <p className="text-moos-500">Damit die Kothe beim nächsten Mal ganz bleibt.</p>
      </div>

      <h2 className="mb-3 font-semibold text-moos-700">Deine Lager</h2>
      {isLoading && <p className="text-moos-400">Lade …</p>}
      {depots && depots.length === 0 && (
        <EmptyState
          emoji="📦"
          title="Noch kein Lager freigegeben"
          hint={isAdmin ? 'Leg unten dein erstes Lager an.' : 'Ein Admin muss dir Zugriff auf ein Lager geben.'}
        />
      )}
      <div className="grid gap-3">
        {depots?.map((d) => (
          <DepotRow key={d.id} depot={d} editable={isAdmin} />
        ))}
      </div>

      {isAdmin && (
        <form
          className="mt-8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Neues Lager (z.B. Stamm Grauer Reiter)"
            className="flex-1 rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500"
          />
          <Button type="submit" disabled={!name.trim() || create.isPending}>
            Anlegen
          </Button>
        </form>
      )}
      {create.isError && <p className="mt-2 text-sm text-red-600">{(create.error as Error).message}</p>}

      <AppVersion className="pt-8" />
    </div>
  );
}

/** Eine Lager-Kachel. Admins können Name und Beschreibung inline bearbeiten. */
function DepotRow({ depot, editable }: { depot: Depot; editable: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(depot.name);
  const [description, setDescription] = useState(depot.description ?? '');

  const update = useMutation({
    mutationFn: () => api.updateDepot(depot.id, { name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['depots'] });
    },
  });

  const startEditing = () => {
    setName(depot.name);
    setDescription(depot.description ?? '');
    update.reset();
    setEditing(true);
  };

  if (editing) {
    return (
      <Card className="p-4">
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) update.mutate();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lager-Name"
            aria-label="Lager-Name"
            autoFocus
            className={inputClass}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung (optional)"
            aria-label="Beschreibung"
            className={inputClass}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!name.trim() || update.isPending}>
              Speichern
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Abbrechen
            </Button>
          </div>
          {update.isError && <p className="text-sm text-red-600">{(update.error as Error).message}</p>}
        </form>
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between p-4 transition hover:ring-moos-300">
      <Link to={`/lager/${depot.id}`} className="min-w-0 flex-1">
        <p className="font-semibold text-moos-800">{depot.name}</p>
        {depot.description && <p className="text-sm text-moos-500">{depot.description}</p>}
      </Link>
      <div className="ml-3 flex shrink-0 items-center gap-3">
        {editable && (
          <button
            onClick={startEditing}
            className="text-moos-500 hover:text-moos-700"
            aria-label="Lager bearbeiten"
            title="Lager bearbeiten"
          >
            ✏️
          </button>
        )}
        <Link to={`/lager/${depot.id}`} className="text-moos-400" aria-hidden="true">
          →
        </Link>
      </div>
    </Card>
  );
}
