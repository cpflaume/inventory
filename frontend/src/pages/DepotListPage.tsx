import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, EmptyState } from '../components/ui';

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
          <Link key={d.id} to={`/lager/${d.id}`}>
            <Card className="flex items-center justify-between p-4 transition hover:ring-moos-300">
              <div>
                <p className="font-semibold text-moos-800">{d.name}</p>
                {d.description && <p className="text-sm text-moos-500">{d.description}</p>}
              </div>
              <span className="text-moos-400">→</span>
            </Card>
          </Link>
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
    </div>
  );
}
