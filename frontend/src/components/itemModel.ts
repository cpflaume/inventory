import type { ItemInput } from '../api/client';
import type { Item } from '../api/types';

/** Leeres Formular für die Neuanlage eines Gegenstands. */
export const emptyItem: ItemInput = { name: '', category: '', quantity: 1, conditionFlag: 'GREEN' };

/** Entity → editierbares Formularmodell. */
export function itemToInput(item: Item): ItemInput {
  return {
    name: item.name,
    category: item.category ?? '',
    quantity: item.quantity,
    conditionFlag: item.conditionFlag,
    note: item.note ?? '',
    parentItemId: item.parentItemId ?? null,
    locationId: item.locationId ?? null,
    row: item.row ?? null,
    col: item.col ?? null,
  };
}

/**
 * Bereits vergebene Kategorien (eindeutig, alphabetisch) als Vorschläge fürs
 * Dropdown — hält die Kategorien konsistent, erlaubt aber weiter freie Eingabe.
 */
export function collectCategories(items: Item[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const cat = item.category?.trim();
    if (cat) seen.add(cat);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'de'));
}

/** Formular auf gemeinsame Trim-Regeln bringen, bevor es zum Backend geht. */
export function normalizeItem(form: ItemInput): ItemInput {
  return {
    ...form,
    category: form.category?.trim() || undefined,
    note: form.note?.trim() || undefined,
  };
}
