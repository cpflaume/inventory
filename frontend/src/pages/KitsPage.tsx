import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, EmptyState } from '../components/ui';

export default function KitsPage() {
  const { depotId = '' } = useParams();
  const kits = useQuery({ queryKey: ['kits', depotId], queryFn: () => api.listKits(depotId) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-moos-800">⛺ Bausätze</h1>
      <p className="text-sm text-moos-500">
        Ein Bausatz beschreibt, was alles zu einem vollständigen Zelt gehört — die druckbare Stückliste.
      </p>

      {kits.data && kits.data.length === 0 && (
        <EmptyState emoji="📋" title="Noch keine Bausätze" hint="Bausätze legst du z.B. per API oder Seed an." />
      )}

      <div className="grid gap-3">
        {kits.data?.map((kit) => (
          <Card key={kit.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-moos-800">{kit.name}</p>
                {kit.description && <p className="text-sm text-moos-500">{kit.description}</p>}
              </div>
              <Link
                to={`/lager/${depotId}/druck/bausatz/${kit.id}`}
                target="_blank"
                className="whitespace-nowrap rounded-xl bg-lagerfeuer-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-lagerfeuer-600"
              >
                🖨️ Stückliste
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-moos-50 text-sm">
              {kit.positions.map((p) => (
                <li key={p.id} className="flex justify-between py-1.5">
                  <span>{p.label}</span>
                  <span className="text-moos-400">Soll: {p.targetQuantity}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
