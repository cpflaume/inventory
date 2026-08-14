import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { BoxView, CellView, Item, ShelfView } from '../api/types';
import { AppVersion, Button, Card, ConditionDot, EmptyState, Modal } from '../components/ui';
import { ItemDialog, ItemRow } from '../components/items';
import { LocationDrawer } from '../components/LocationDrawer';
import type { LocationTarget } from '../components/locationTarget';
import { useAuth } from '../auth/AuthContext';

export default function WarehousePage() {
  const { depotId = '' } = useParams();
  const qc = useQueryClient();
  const { canEdit: canEditFn } = useAuth();
  const canEdit = canEditFn(depotId);
  const [openTarget, setOpenTarget] = useState<LocationTarget | null>(null);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [adding, setAdding] = useState<null | 'shelf' | 'box'>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouse', depotId],
    queryFn: () => api.warehouse(depotId),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['warehouse', depotId] });

  const openBox = (box: BoxView) => setOpenTarget({ kind: 'box', locationId: box.id, label: box.label });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-moos-800">🏕️ Virtuelles Lager</h1>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button variant="ghost" onClick={() => setAdding('shelf')}>
                + Regal
              </Button>
              <Button variant="ghost" onClick={() => setAdding('box')}>
                + Kiste
              </Button>
            </>
          )}
          <Link to={`/lager/${depotId}/druck/bestand`} target="_blank">
            <Button variant="fire">🖨️ Bestand</Button>
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-moos-400">Lade Lager …</p>}

      {data && data.shelves.length === 0 && data.freestandingBoxes.length === 0 && (
        <EmptyState
          emoji="⛺"
          title="Noch nichts im Lager"
          hint="Zeit, Regale aufzustellen und Kisten zu füllen!"
        />
      )}

      {data?.shelves.map((shelf) => (
        <Shelf
          key={shelf.id}
          shelf={shelf}
          onOpenBox={openBox}
          onOpenCell={(row, col) =>
            setOpenTarget({ kind: 'cell', shelfId: shelf.id, shelfLabel: shelf.label, row, col })
          }
        />
      ))}

      {data && data.freestandingBoxes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-moos-500">
            Freistehende Kisten
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.freestandingBoxes.map((box) => (
              <BoxTile key={box.id} box={box} onClick={() => openBox(box)} />
            ))}
          </div>
        </section>
      )}

      {data && data.unassignedItems.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-moos-500">
            Nicht einsortiert ({data.unassignedItems.length})
          </h2>
          <Card className="divide-y divide-moos-50 p-2">
            {data.unassignedItems.map((it) => (
              <ItemRow key={it.id} item={it} onClick={() => setDetailItem(it)} />
            ))}
          </Card>
        </section>
      )}

      {adding && (
        <AddLocationDialog
          depotId={depotId}
          mode={adding}
          shelves={data?.shelves ?? []}
          onClose={() => setAdding(null)}
          onSaved={() => {
            setAdding(null);
            invalidate();
          }}
        />
      )}

      {openTarget && (
        <LocationDrawer
          depotId={depotId}
          target={openTarget}
          canEdit={canEdit}
          onClose={() => setOpenTarget(null)}
        />
      )}

      {detailItem && (
        <ItemDialog
          depotId={depotId}
          item={detailItem}
          canEdit={canEdit}
          onClose={() => setDetailItem(null)}
        />
      )}

      <AppVersion className="pt-2" />
    </div>
  );
}

function Shelf({
  shelf,
  onOpenBox,
  onOpenCell,
}: {
  shelf: ShelfView;
  onOpenBox: (b: BoxView) => void;
  onOpenCell: (row: number, col: number) => void;
}) {
  const byCell = new Map<string, CellView>();
  shelf.cells.forEach((c) => byCell.set(`${c.row}-${c.col}`, c));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between bg-gradient-to-r from-moos-700 to-moos-600 px-4 py-2 text-white">
        <span className="font-semibold">🪵 {shelf.label}</span>
        <span className="text-xs text-moos-100">
          {shelf.gridRows} × {shelf.gridCols} Fächer
        </span>
      </div>
      <div
        className="grid gap-2 bg-zelt-100 p-3"
        style={{ gridTemplateColumns: `repeat(${shelf.gridCols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: shelf.gridRows }).flatMap((_, r) =>
          Array.from({ length: shelf.gridCols }).map((__, c) => {
            const cell = byCell.get(`${r}-${c}`);
            if (cell?.box) {
              return (
                <div key={`${r}-${c}`} className="min-h-[64px] rounded-lg border-2 border-zelt-300/70 bg-white/60 p-1">
                  <BoxTile box={cell.box} onClick={() => onOpenBox(cell.box!)} compact />
                </div>
              );
            }
            // Leere und lose-belegte Fächer sind anklickbar (Detail/Hinzufügen).
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => onOpenCell(r, c)}
                className="min-h-[64px] rounded-lg border-2 border-zelt-300/70 bg-white/60 p-1 text-left transition hover:border-moos-400 hover:bg-white"
                title={`Fach ${r + 1}/${c + 1}`}
              >
                {cell && cell.looseItems.length > 0 && (
                  <ul className="space-y-0.5 p-1 text-xs text-moos-700">
                    {cell.looseItems.map((it) => (
                      <li key={it.id} className="flex items-center gap-1">
                        <ConditionDot flag={it.conditionFlag} />
                        <span className="truncate">{it.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          }),
        )}
      </div>
    </Card>
  );
}

function BoxTile({
  box,
  onClick,
  compact,
}: {
  box: BoxView;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full flex-col items-start rounded-lg bg-lagerfeuer-400/90 text-left text-white shadow-sm transition hover:bg-lagerfeuer-500 ${
        compact ? 'h-full p-2' : 'w-40 p-3'
      }`}
      title={box.label}
    >
      <span className="text-lg leading-none">📦</span>
      {/* Bezeichnung immer sichtbar. */}
      <span className="mt-1 line-clamp-2 text-xs font-semibold">{box.label}</span>
      <span className="mt-auto pt-1 text-[11px] text-white/80">
        {box.itemCount} Teile{box.openDefects > 0 && ` · 🐛${box.openDefects}`}
      </span>
    </button>
  );
}

function AddLocationDialog({
  depotId,
  mode,
  shelves,
  onClose,
  onSaved,
}: {
  depotId: string;
  mode: 'shelf' | 'box';
  shelves: ShelfView[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState('');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [shelfId, setShelfId] = useState<string>('');
  const [cell, setCell] = useState('');

  const save = useMutation({
    mutationFn: () => {
      if (mode === 'shelf') {
        return api.createLocation(depotId, { type: 'SHELF', label, gridRows: rows, gridCols: cols });
      }
      const [r, c] = cell ? cell.split('-').map(Number) : [null, null];
      return api.createLocation(depotId, {
        type: 'BOX',
        label,
        parentLocationId: shelfId || null,
        row: shelfId ? r : null,
        col: shelfId ? c : null,
      });
    },
    onSuccess: onSaved,
  });

  const chosenShelf = shelves.find((s) => s.id === shelfId);

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onClose}>
        Abbrechen
      </Button>
      <Button
        onClick={() => save.mutate()}
        disabled={!label.trim() || save.isPending || (mode === 'box' && !!shelfId && !cell)}
      >
        Speichern
      </Button>
    </div>
  );

  return (
    <Modal title={mode === 'shelf' ? '🪵 Neues Regal' : '📦 Neue Kiste'} onClose={onClose} footer={footer}>
      <div className="space-y-4">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={mode === 'shelf' ? 'Regal A' : 'Kiste 5 · Heringe'}
          className="w-full rounded-xl border border-moos-200 px-4 py-2 outline-none focus:border-moos-500"
        />

        {mode === 'shelf' && (
          <div className="flex gap-6">
            <Stepper label="Höhe (Fächer)" value={rows} set={setRows} />
            <Stepper label="Breite (Fächer)" value={cols} set={setCols} />
          </div>
        )}

        {mode === 'box' && (
          <div className="space-y-2">
            <label className="block text-sm text-moos-600">Platzierung</label>
            <select
              value={shelfId}
              onChange={(e) => {
                setShelfId(e.target.value);
                setCell('');
              }}
              className="w-full rounded-xl border border-moos-200 px-3 py-2"
            >
              <option value="">Freistehend (unter den Regalen)</option>
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  In {s.label}
                </option>
              ))}
            </select>
            {chosenShelf && (
              <select
                value={cell}
                onChange={(e) => setCell(e.target.value)}
                className="w-full rounded-xl border border-moos-200 px-3 py-2"
              >
                <option value="">Fach wählen …</option>
                {Array.from({ length: chosenShelf.gridRows }).flatMap((_, r) =>
                  Array.from({ length: chosenShelf.gridCols }).map((__, c) => (
                    <option key={`${r}-${c}`} value={`${r}-${c}`}>
                      Fach Reihe {r + 1}, Spalte {c + 1}
                    </option>
                  )),
                )}
              </select>
            )}
          </div>
        )}

        {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
      </div>
    </Modal>
  );
}

function Stepper({ label, value, set }: { label: string; value: number; set: (v: number) => void }) {
  return (
    <div className="text-center">
      <p className="mb-1 text-xs text-moos-600">{label}</p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => set(Math.max(1, value - 1))}>
          −
        </Button>
        <span className="w-6 text-lg font-bold text-moos-800">{value}</span>
        <Button variant="ghost" onClick={() => set(Math.min(8, value + 1))}>
          +
        </Button>
      </div>
    </div>
  );
}
