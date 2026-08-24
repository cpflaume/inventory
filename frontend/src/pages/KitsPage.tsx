import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Kit } from '../api/types';
import { Button, Card, EmptyState, Modal, inputClass } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

export default function KitsPage() {
  const { depotId = '' } = useParams();
  const { canEdit: canEditFn } = useAuth();
  const canEdit = canEditFn(depotId);
  const kits = useQuery({ queryKey: ['kits', depotId], queryFn: () => api.listKits(depotId) });
  const [instantiate, setInstantiate] = useState<Kit | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-moos-800">⛺ Bausätze</h1>
      <p className="text-sm text-moos-500">
        Ein Bausatz beschreibt, was alles zu einem vollständigen Zelt gehört — die druckbare Stückliste.
        Du kannst ihn außerdem mit einem Klick als neue Kiste ins Lager übernehmen.
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
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setInstantiate(kit)}
                    className="whitespace-nowrap rounded-xl bg-moos-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-moos-700"
                  >
                    📦 Ins Lager übernehmen
                  </button>
                )}
                <Link
                  to={`/lager/${depotId}/druck/bausatz/${kit.id}`}
                  target="_blank"
                  className="whitespace-nowrap rounded-xl bg-lagerfeuer-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-lagerfeuer-600"
                >
                  🖨️ Stückliste
                </Link>
              </div>
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

      {instantiate && (
        <InstantiateKitDialog depotId={depotId} kit={instantiate} onClose={() => setInstantiate(null)} />
      )}
    </div>
  );
}

/**
 * Übernimmt einen Bausatz als neue Kiste ins Lager: der Anwender wählt den
 * Kistennamen, alle Positionen werden als neue Gegenstände darin angelegt.
 */
function InstantiateKitDialog({ depotId, kit, onClose }: { depotId: string; kit: Kit; onClose: () => void }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState(kit.name);
  const [done, setDone] = useState<{ boxLabel: string; itemCount: number } | null>(null);

  const create = useMutation({
    mutationFn: () => api.instantiateKit(depotId, kit.id, label.trim()),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['warehouse', depotId] });
      qc.invalidateQueries({ queryKey: ['items', depotId] });
      qc.invalidateQueries({ queryKey: ['locations', depotId] });
      setDone({ boxLabel: res.boxLabel, itemCount: res.itemCount });
    },
  });

  const footer = done ? (
    <div className="flex justify-end">
      <Button onClick={onClose}>Fertig</Button>
    </div>
  ) : (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onClose}>
        Abbrechen
      </Button>
      <Button onClick={() => create.mutate()} disabled={!label.trim() || create.isPending}>
        📦 Kiste anlegen
      </Button>
    </div>
  );

  return (
    <Modal title={`📦 „${kit.name}" ins Lager übernehmen`} onClose={onClose} footer={footer}>
      {done ? (
        <div className="space-y-3">
          <p className="text-moos-800">
            ✅ Kiste <span className="font-semibold">{done.boxLabel}</span> mit {done.itemCount}{' '}
            {done.itemCount === 1 ? 'Gegenstand' : 'Gegenständen'} angelegt.
          </p>
          <p className="text-sm text-moos-500">
            Die Kiste steht als freistehende Kiste im virtuellen Lager — von dort kannst du sie in ein
            Regalfach ziehen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-moos-600">
            Es wird eine <span className="font-semibold">neue Kiste</span> angelegt und alle{' '}
            {kit.positions.length} Positionen dieses Bausatzes werden als{' '}
            <span className="font-semibold">neue Gegenstände</span> in der jeweiligen Soll-Menge darin
            abgelegt. Bestehende Gegenstände bleiben unverändert.
          </p>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-moos-700">Name der neuen Kiste</span>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="z.B. Kothe – Neu 2026"
              className={inputClass}
            />
          </label>
          {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
        </div>
      )}
    </Modal>
  );
}
