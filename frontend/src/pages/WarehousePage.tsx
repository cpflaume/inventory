import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { BoxView, CellView, Item, ShelfView } from '../api/types';
import { Button, Card, ConditionDot, EmptyState, Modal } from '../components/ui';
import { ItemDialog, ItemRow } from '../components/items';
import { ChestArt, EmptyCellArt, woodStyle } from '../components/warehouseArt';
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

  // Stabiler Seed je Regal, damit die Fund-Grafiken pro Regal variieren.
  const shelfSeed = [...shelf.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);

  return (
    <div className="relative">
      {/* Holzrahmen des Regals (stehende Maserung = Pfosten). */}
      <div
        className="overflow-hidden rounded-2xl p-2 shadow-lg ring-1 ring-holz-900/40"
        style={woodStyle({ dir: 'v', seed: 3, from: '#b3823f', to: '#6f4520' })}
      >
        {/* Geschnitztes Namensschild. */}
        <div className="mb-2 flex items-center justify-between rounded-lg border border-holz-900/40 bg-holz-900/25 px-3 py-1.5">
          <span className="font-semibold text-holz-50 [text-shadow:0_1px_1px_rgba(0,0,0,.55)]">
            🪵 {shelf.label}
          </span>
          <span className="rounded-full bg-holz-900/40 px-2 py-0.5 text-xs text-holz-100">
            {shelf.gridRows} × {shelf.gridCols} Fächer
          </span>
        </div>

        {/* Innenraum mit liegender Maserung (Fachböden). */}
        <div
          className="grid gap-2 rounded-lg p-2 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${shelf.gridCols}, minmax(0, 1fr))`,
            ...woodStyle({ dir: 'h', seed: 11, from: '#7a4e26', to: '#4a2c14' }),
          }}
        >
          {Array.from({ length: shelf.gridRows }).flatMap((_, r) =>
            Array.from({ length: shelf.gridCols }).map((__, c) => {
              const cell = byCell.get(`${r}-${c}`);
              const cellSeed = shelfSeed + r * 5 + c * 3;
              if (cell?.box) {
                return (
                  <BoxTile
                    key={`${r}-${c}`}
                    box={cell.box}
                    onClick={() => onOpenBox(cell.box!)}
                    compact
                  />
                );
              }
              // Leere und lose-belegte Fächer sind anklickbar (Detail/Hinzufügen).
              const hasLoose = cell && cell.looseItems.length > 0;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => onOpenCell(r, c)}
                  className="group relative min-h-[72px] overflow-hidden rounded-md text-left transition hover:brightness-110 hover:ring-2 hover:ring-lagerfeuer-400"
                  style={{
                    ...woodStyle({ dir: 'h', seed: cellSeed, from: '#6f4520', to: '#38210f' }),
                    boxShadow:
                      'inset 0 3px 7px rgba(0,0,0,.6), inset 0 -4px 6px rgba(0,0,0,.4), inset 3px 0 5px rgba(0,0,0,.35), inset -3px 0 5px rgba(0,0,0,.35)',
                  }}
                  title={`Fach ${r + 1}/${c + 1}`}
                >
                  {hasLoose ? (
                    <ul className="relative z-10 m-1 space-y-0.5 rounded bg-white/85 p-1 text-xs text-moos-800 shadow-sm ring-1 ring-black/10">
                      {cell!.looseItems.map((it) => (
                        <li key={it.id} className="flex items-center gap-1">
                          <ConditionDot flag={it.conditionFlag} />
                          <span className="truncate">{it.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyCellArt seed={cellSeed} />
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* Füße unter dem Regal. */}
      <div className="mx-4 flex justify-between">
        <ShelfFoot />
        <ShelfFoot />
      </div>
    </div>
  );
}

/** Ein Regalfuß: kurzes Holzbein mit Bodenschatten. */
function ShelfFoot() {
  return (
    <div className="relative">
      <div
        className="h-4 w-10 rounded-b-md ring-1 ring-holz-900/50"
        style={woodStyle({ dir: 'v', seed: 5, from: '#8a5a2b', to: '#432611' })}
      />
      <div className="mx-auto h-1 w-12 rounded-full bg-black/25 blur-[1px]" />
    </div>
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
  // Stabiler Seed je Kiste für die Tonvariation der Truhe.
  const seed = [...box.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-md text-left text-white shadow-md ring-1 ring-holz-900/50 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-lagerfeuer-400 ${
        compact ? 'h-full min-h-[72px] w-full p-1.5' : 'h-28 w-40 p-2'
      }`}
      title={box.label}
    >
      <ChestArt seed={seed} />
      {/* Bezeichnung immer sichtbar – als „angenageltes" Schild auf dem Deckel. */}
      <span className="relative z-10 flex h-full flex-col">
        <span className="line-clamp-2 rounded bg-holz-900/75 px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-holz-50 shadow-sm ring-1 ring-holz-900/40">
          {box.label}
        </span>
        <span className="mt-auto self-start rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/90">
          {box.itemCount} Teile{box.openDefects > 0 && ` · 🐛${box.openDefects}`}
        </span>
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
