import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ItemInput } from '../api/client';
import type { ConditionFlag, DefectReport, Item, Location } from '../api/types';
import { Button, Card, ConditionDot, Modal, inputClass } from './ui';
import { ItemIcon } from './ItemIcon';
import { type LocationTarget, targetLabel, targetPatch } from './locationTarget';
import { collectCategories, emptyItem, itemToInput, normalizeItem } from './itemModel';

const CELL_TOKEN = '__cell__';

/**
 * Wiederverwendbares Gegenstand-Formular. Ohne `fixedTarget` bietet es eine
 * Kisten-Auswahl (plus „nicht zugeordnet"); mit `fixedTarget` ist der Lagerort
 * fest (z.B. beim Anlegen direkt in eine Kiste/ein Fach).
 */
export function ItemForm({
  value,
  onChange,
  boxes,
  categories = [],
  fixedTarget,
  onClearTarget,
}: {
  value: ItemInput;
  onChange: (v: ItemInput) => void;
  boxes: Location[];
  /** Bereits vergebene Kategorien als Dropdown-Vorschläge (freie Eingabe bleibt möglich). */
  categories?: string[];
  fixedTarget?: LocationTarget | null;
  /** Wird gesetzt, darf der feste Lagerort aufgehoben werden (× am Chip). */
  onClearTarget?: () => void;
}) {
  const categoryListId = useId();
  const boxIds = new Set(boxes.map((b) => b.id));
  const isLooseCell = !!value.locationId && !boxIds.has(value.locationId) && value.row != null;
  const selectValue =
    value.locationId == null
      ? ''
      : boxIds.has(value.locationId)
        ? value.locationId
        : isLooseCell
          ? CELL_TOKEN
          : '';

  return (
    <div className="space-y-3">
      {/* Live-Vorschau des automatisch erkannten Icons beim Tippen des Namens. */}
      <div className="flex items-center gap-3">
        <ItemIcon name={value.name} size="md" />
        <input
          autoFocus
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Was? (z.B. Hammer, Jurtendach)"
          className={`${inputClass} min-w-0 flex-1`}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={value.category ?? ''}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          placeholder="Kategorie"
          list={categoryListId}
          className={`${inputClass} min-w-0 flex-1`}
        />
        {categories.length > 0 && (
          <datalist id={categoryListId}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        )}
        <input
          type="number"
          min={0}
          value={value.quantity}
          onChange={(e) => onChange({ ...value, quantity: Number(e.target.value) })}
          className={`${inputClass} w-20`}
          aria-label="Menge"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={value.conditionFlag ?? 'GREEN'}
          onChange={(e) => onChange({ ...value, conditionFlag: e.target.value as ConditionFlag })}
          className={`${inputClass} w-auto`}
        >
          <option value="GREEN">🟢 einsatzbereit</option>
          <option value="YELLOW">🟡 kleine Macke</option>
          <option value="RED">🔴 defekt</option>
        </select>
        {fixedTarget ? (
          <span className="flex flex-1 items-center gap-2 rounded-xl bg-moos-50 px-3 py-2 text-sm text-moos-600">
            <span className="min-w-0 flex-1 truncate">{targetLabel(fixedTarget)}</span>
            {onClearTarget && (
              <button
                type="button"
                onClick={onClearTarget}
                className="text-moos-400 hover:text-moos-600"
                aria-label="Lagerort aufheben"
                title="Lagerort aufheben"
              >
                ✕
              </button>
            )}
          </span>
        ) : (
          <select
            value={selectValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === CELL_TOKEN) return; // aktuelles Fach beibehalten
              onChange(
                v === ''
                  ? { ...value, locationId: null, row: null, col: null }
                  : { ...value, locationId: v, row: null, col: null },
              );
            }}
            className={`${inputClass} min-w-0 flex-1`}
            aria-label="Lagerort"
          >
            <option value="">In welche Kiste? (optional)</option>
            {isLooseCell && <option value={CELL_TOKEN}>🪵 Regalfach (aktuell)</option>}
            {boxes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <input
        value={value.note ?? ''}
        onChange={(e) => onChange({ ...value, note: e.target.value })}
        placeholder="Notiz (optional)"
        className={inputClass}
      />
    </div>
  );
}

/** Anklickbare Zeile eines Gegenstands — überall gleich, öffnet die Detailsicht. */
export function ItemRow({ item, onClick }: { item: Item; onClick?: () => void }) {
  const meta = [item.category, item.note].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-moos-50"
    >
      <span className="relative shrink-0">
        <ItemIcon name={item.name} size="sm" />
        {/* Zustands-Ampel als kleiner Punkt an der Icon-Ecke. */}
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-px">
          <ConditionDot flag={item.conditionFlag} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-moos-800">{item.name}</span>
        {meta && <span className="block truncate text-xs text-moos-500">{meta}</span>}
      </span>
      <span className="text-moos-400">×{item.quantity}</span>
    </button>
  );
}

const SEVERITY_ICON = { MACKE: '🩹', DEFEKT: '💥' } as const;

/** Kompakte Mängel-Liste eines Gegenstands (nur lesend) für die Detailsicht. */
function ItemDefects({ defects }: { defects: DefectReport[] }) {
  if (defects.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-moos-500">
        Mängel ({defects.length})
      </p>
      {defects.map((d) => (
        <div key={d.id} className="flex items-center gap-2 rounded-lg bg-moos-50 px-3 py-2 text-sm">
          <span>{SEVERITY_ICON[d.severity]}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-moos-800">{d.title}</span>
            {d.description && <span className="block truncate text-xs text-moos-500">{d.description}</span>}
          </span>
          <span className={`text-xs ${d.status === 'OPEN' ? 'text-lagerfeuer-600' : 'text-moos-400'}`}>
            {d.status === 'OPEN' ? 'offen' : 'erledigt'}
          </span>
        </div>
      ))}
    </div>
  );
}

function LabeledValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-moos-500">{label}</p>
      <p className="text-moos-800">{children}</p>
    </div>
  );
}

/**
 * Zentrale Detail-/Bearbeiten-Ansicht eines Gegenstands. Ohne `item` legt sie
 * einen neuen an (mit optionalem `fixedTarget`). Bestehende zeigt sie zunächst
 * lesend inkl. Mängeln; `canEdit` schaltet Bearbeiten/Löschen frei.
 */
export function ItemDialog({
  depotId,
  item,
  fixedTarget,
  canEdit,
  onClose,
  onSaved,
}: {
  depotId: string;
  item?: Item | null;
  fixedTarget?: LocationTarget | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const isNew = !item;
  const [editing, setEditing] = useState(isNew);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<ItemInput>(() => {
    if (item) return itemToInput(item);
    return fixedTarget ? { ...emptyItem, ...targetPatch(fixedTarget) } : emptyItem;
  });

  const locations = useQuery({
    queryKey: ['locations', depotId],
    queryFn: () => api.listLocations(depotId),
  });
  const boxes = locations.data?.filter((l) => l.type === 'BOX') ?? [];

  const items = useQuery({
    queryKey: ['items', depotId],
    queryFn: () => api.listItems(depotId),
    enabled: editing,
  });
  const categories = collectCategories(items.data ?? []);

  const defects = useQuery({
    queryKey: ['defects', depotId],
    queryFn: () => api.listDefects(depotId),
    enabled: !isNew,
  });
  const itemDefects = defects.data?.filter((d) => d.itemId === item?.id) ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['items', depotId] });
    qc.invalidateQueries({ queryKey: ['warehouse', depotId] });
    qc.invalidateQueries({ queryKey: ['box-contents', depotId] });
  };

  const save = useMutation({
    mutationFn: () =>
      item
        ? api.updateItem(depotId, item.id, normalizeItem(form))
        : api.createItem(depotId, normalizeItem(form)),
    onSuccess: () => {
      invalidate();
      onSaved?.();
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: () => api.deleteItem(depotId, item!.id),
    onSuccess: () => {
      invalidate();
      onSaved?.();
      onClose();
    },
  });

  const locationLabel = (() => {
    if (!item?.locationId) return 'nicht zugeordnet';
    const loc = locations.data?.find((l) => l.id === item.locationId);
    if (!loc) return 'zugeordnet';
    if (loc.type === 'BOX') return `📦 ${loc.label}`;
    return `🪵 ${loc.label} · Fach ${(item.row ?? 0) + 1}/${(item.col ?? 0) + 1}`;
  })();

  const title = isNew ? '🎒 Neuer Gegenstand' : editing ? '✏️ Bearbeiten' : `🎒 ${item!.name}`;

  const footer = editing ? (
    <div className="flex justify-end gap-2">
      {!isNew && (
        <Button variant="ghost" onClick={() => setEditing(false)}>
          Abbrechen
        </Button>
      )}
      <Button onClick={() => save.mutate()} disabled={!form.name.trim() || save.isPending}>
        Speichern
      </Button>
    </div>
  ) : canEdit ? (
    <div className="flex justify-between gap-2">
      <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
        🗑️ Löschen
      </Button>
      <Button onClick={() => setEditing(true)}>✏️ Bearbeiten</Button>
    </div>
  ) : undefined;

  return (
    <Modal title={title} onClose={onClose} footer={footer}>
      {editing ? (
        <div className="space-y-3">
          <ItemForm
            value={form}
            onChange={setForm}
            boxes={boxes}
            categories={categories}
            fixedTarget={isNew ? fixedTarget : null}
          />
          {save.isError && <p className="text-sm text-red-600">{(save.error as Error).message}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ItemIcon name={item!.name} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <ConditionDot flag={item!.conditionFlag} />
                <span className="truncate text-lg font-semibold text-moos-800">{item!.name}</span>
              </span>
            </span>
            <span className="text-moos-400">×{item!.quantity}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {item!.category && <LabeledValue label="Kategorie">{item!.category}</LabeledValue>}
            <LabeledValue label="Lagerort">{locationLabel}</LabeledValue>
          </div>
          {item!.note && <LabeledValue label="Notiz">{item!.note}</LabeledValue>}
          <ItemDefects defects={itemDefects} />
        </div>
      )}

      {confirmDelete && (
        <ConfirmDelete
          message={`„${item!.name}" endgültig aus dem Lager löschen?`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => remove.mutate()}
          pending={remove.isPending}
        />
      )}
    </Modal>
  );
}

/** Kleiner Bestätigungs-Overlay für destruktive Aktionen. */
export function ConfirmDelete({
  message,
  onCancel,
  onConfirm,
  pending,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <Card className="space-y-4 p-5">
          <p className="text-moos-800">{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button variant="fire" onClick={onConfirm} disabled={pending}>
              Löschen
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
