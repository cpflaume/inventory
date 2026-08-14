import type { ItemInput } from '../api/client';

/**
 * Ein Zuordnungsziel für einen Gegenstand: entweder eine Kiste (BOX) oder ein
 * konkretes Regalfach (SHELF + row/col, lose Lagerung). Beide Fälle einheitlich
 * zu behandeln vermeidet Redundanz in Kisten- und Fach-Ansicht.
 */
export type LocationTarget =
  | { kind: 'box'; locationId: string; label: string }
  | { kind: 'cell'; shelfId: string; shelfLabel: string; row: number; col: number };

/** Der Teil eines ItemInput, der die Platzierung beschreibt. */
export function targetPatch(target: LocationTarget): Pick<ItemInput, 'locationId' | 'row' | 'col'> {
  return target.kind === 'box'
    ? { locationId: target.locationId, row: null, col: null }
    : { locationId: target.shelfId, row: target.row, col: target.col };
}

/** Menschliche Bezeichnung des Ziels (inkl. Emoji). */
export function targetLabel(target: LocationTarget): string {
  return target.kind === 'box'
    ? `📦 ${target.label}`
    : `🪵 ${target.shelfLabel} · Fach ${target.row + 1}/${target.col + 1}`;
}
