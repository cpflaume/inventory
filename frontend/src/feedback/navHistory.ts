import type { FeedbackNavEntry } from '../api/types';

// Schlichter, modulweiter Ring-Puffer der zuletzt besuchten Routen. Bewusst ohne State/Store:
// Der Verlauf dient nur als Kontext fürs Feedback und muss kein Re-Render auslösen.
const MAX_ENTRIES = 15;
const entries: FeedbackNavEntry[] = [];

/** Route protokollieren (aufeinanderfolgende Duplikate werden zusammengefasst). */
export function recordNavigation(path: string): void {
  const last = entries[entries.length - 1];
  if (last && last.path === path) return;
  entries.push({ path, at: new Date().toISOString() });
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
}

/** Momentaufnahme des Verlaufs (älteste zuerst). */
export function getNavigationHistory(): FeedbackNavEntry[] {
  return [...entries];
}
