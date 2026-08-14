import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Item } from '../api/types';
import { Button, EmptyState, Modal } from './ui';
import { ItemDialog, ItemRow } from './items';
import { itemToInput, normalizeItem } from './itemModel';
import { type LocationTarget, targetLabel, targetPatch } from './locationTarget';

type AddMode = null | 'choose' | 'existing';

/**
 * Inhalts-Ansicht eines Lagerorts (Kiste ODER Regalfach) mit — je nach Rechten —
 * Hinzufügen (bestehend/neu) und Löschen (aus dem Lager ODER nur die Zuordnung).
 * Klick auf einen Gegenstand öffnet dessen Detailsicht.
 */
export function LocationDrawer({
  depotId,
  target,
  canEdit,
  onClose,
}: {
  depotId: string;
  target: LocationTarget;
  canEdit: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [detail, setDetail] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);

  // Der Lager-View liefert die losen Fach-Gegenstände und die noch nicht
  // zugeordneten. Für Kisten holt ein eigener Endpoint den Inhalt.
  const warehouse = useQuery({
    queryKey: ['warehouse', depotId],
    queryFn: () => api.warehouse(depotId),
  });
  const boxContents = useQuery({
    queryKey: ['box-contents', depotId, target.kind === 'box' ? target.locationId : ''],
    queryFn: () => api.boxContents(depotId, (target as { locationId: string }).locationId),
    enabled: target.kind === 'box',
  });

  const items: Item[] =
    target.kind === 'box'
      ? (boxContents.data?.items ?? [])
      : (warehouse.data?.shelves
          .find((s) => s.id === target.shelfId)
          ?.cells.find((c) => c.row === target.row && c.col === target.col)?.looseItems ?? []);

  const unassignedItems = warehouse.data?.unassignedItems ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['warehouse', depotId] });
    qc.invalidateQueries({ queryKey: ['box-contents', depotId] });
    qc.invalidateQueries({ queryKey: ['items', depotId] });
  };

  const assign = useMutation({
    mutationFn: (item: Item) =>
      api.updateItem(depotId, item.id, normalizeItem({ ...itemToInput(item), ...targetPatch(target) })),
    onSuccess: () => {
      invalidate();
      setAddMode(null);
    },
  });

  const unassign = useMutation({
    mutationFn: (item: Item) =>
      api.updateItem(depotId, item.id, normalizeItem({ ...itemToInput(item), locationId: null, row: null, col: null })),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
  });

  const remove = useMutation({
    mutationFn: (item: Item) => api.deleteItem(depotId, item.id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
  });

  const title = targetLabel(target);
  const printLink = target.kind === 'box' ? `/lager/${depotId}/druck/kiste/${target.locationId}` : null;

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {canEdit ? (
        <Button onClick={() => setAddMode('choose')}>+ Gegenstand</Button>
      ) : (
        <span />
      )}
      {printLink && (
        <Link to={printLink} target="_blank">
          <Button variant="fire">🖨️ Beipackzettel drucken</Button>
        </Link>
      )}
    </div>
  );

  return (
    <Modal title={title} onClose={onClose} footer={footer} minHalf>
      {items.length === 0 ? (
        <EmptyState emoji="📭" title="Noch nichts hier" hint={canEdit ? 'Füge unten Gegenstände hinzu.' : undefined} />
      ) : (
        <ul className="divide-y divide-moos-50">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-1">
              <ItemRow item={it} onClick={() => setDetail(it)} />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setDeleting(it)}
                  className="shrink-0 rounded-lg px-2 py-2 text-moos-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`„${it.name}" entfernen`}
                  title="Entfernen"
                >
                  🗑️
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {detail && (
        <ItemDialog
          depotId={depotId}
          item={detail}
          canEdit={canEdit}
          onClose={() => setDetail(null)}
        />
      )}

      {addMode === 'choose' && (
        <ChoosePanel
          onClose={() => setAddMode(null)}
          onExisting={() => setAddMode('existing')}
          onNew={() => navigate(`/lager/${depotId}/material`, { state: { target } })}
        />
      )}

      {addMode === 'existing' && (
        <ExistingPanel
          items={unassignedItems}
          pending={assign.isPending}
          onClose={() => setAddMode(null)}
          onPick={(it) => assign.mutate(it)}
        />
      )}

      {deleting && (
        <DeletePanel
          item={deleting}
          onClose={() => setDeleting(null)}
          onlyList={target.kind === 'box' ? 'aus dieser Kiste' : 'aus diesem Fach'}
          onRemoveFromList={() => unassign.mutate(deleting)}
          onRemoveFromWarehouse={() => remove.mutate(deleting)}
          pending={unassign.isPending || remove.isPending}
        />
      )}
    </Modal>
  );
}

/** Overlay-Panel: „bestehenden" vs. „neuen" Gegenstand hinzufügen. */
function ChoosePanel({
  onClose,
  onExisting,
  onNew,
}: {
  onClose: () => void;
  onExisting: () => void;
  onNew: () => void;
}) {
  return (
    <Modal title="Gegenstand hinzufügen" onClose={onClose}>
      <div className="grid gap-3">
        <button
          type="button"
          onClick={onExisting}
          className="rounded-xl border-2 border-moos-100 p-4 text-left hover:border-moos-300"
        >
          <p className="font-semibold text-moos-800">📎 Bestehenden zuordnen</p>
          <p className="text-sm text-moos-500">Aus den noch nicht zugeordneten Gegenständen wählen.</p>
        </button>
        <button
          type="button"
          onClick={onNew}
          className="rounded-xl border-2 border-moos-100 p-4 text-left hover:border-moos-300"
        >
          <p className="font-semibold text-moos-800">➕ Neuen anlegen</p>
          <p className="text-sm text-moos-500">Zum Material-Formular — dieser Lagerort ist vorausgewählt.</p>
        </button>
      </div>
    </Modal>
  );
}

/** Overlay-Panel: Liste nicht zugeordneter Gegenstände zur Auswahl. */
function ExistingPanel({
  items,
  pending,
  onClose,
  onPick,
}: {
  items: Item[];
  pending: boolean;
  onClose: () => void;
  onPick: (item: Item) => void;
}) {
  return (
    <Modal title="Bestehenden zuordnen" onClose={onClose}>
      {items.length === 0 ? (
        <EmptyState emoji="✅" title="Nichts offen" hint="Alle Gegenstände sind bereits zugeordnet." />
      ) : (
        <ul className="divide-y divide-moos-50">
          {items.map((it) => (
            <li key={it.id}>
              <ItemRow item={it} onClick={() => !pending && onPick(it)} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/** Overlay-Panel: Löschen — aus dem Lager ODER nur die Zuordnung. */
function DeletePanel({
  item,
  onlyList,
  onClose,
  onRemoveFromList,
  onRemoveFromWarehouse,
  pending,
}: {
  item: Item;
  onlyList: string;
  onClose: () => void;
  onRemoveFromList: () => void;
  onRemoveFromWarehouse: () => void;
  pending: boolean;
}) {
  return (
    <Modal title={`„${item.name}" entfernen`} onClose={onClose}>
      <div className="grid gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={onRemoveFromList}
          className="rounded-xl border-2 border-moos-100 p-4 text-left hover:border-moos-300 disabled:opacity-50"
        >
          <p className="font-semibold text-moos-800">📤 Nur {onlyList} nehmen</p>
          <p className="text-sm text-moos-500">Der Gegenstand bleibt im Lager, aber ohne Zuordnung.</p>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onRemoveFromWarehouse}
          className="rounded-xl border-2 border-red-100 p-4 text-left hover:border-red-300 disabled:opacity-50"
        >
          <p className="font-semibold text-red-700">🗑️ Ganz aus dem Lager löschen</p>
          <p className="text-sm text-moos-500">Der Gegenstand wird endgültig entfernt.</p>
        </button>
      </div>
    </Modal>
  );
}
