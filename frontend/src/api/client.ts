// Schlanker, typsicherer API-Client (fetch). Basis-URL ist relativ (/api),
// im Dev über den Vite-Proxy, in Produktion über Caddy an denselben Host.
import type {
  BoxContentsView,
  DefectReport,
  Depot,
  InventoryView,
  Item,
  Kit,
  Location,
  Severity,
  WarehouseView,
} from './types';

const BASE = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // Antwort hatte keinen JSON-Body — Statuszeile genügt.
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface ItemInput {
  name: string;
  category?: string;
  quantity: number;
  parentItemId?: string | null;
  locationId?: string | null;
  row?: number | null;
  col?: number | null;
  conditionFlag?: string;
  note?: string;
}

export interface LocationInput {
  type: 'SHELF' | 'BOX';
  label: string;
  gridRows?: number | null;
  gridCols?: number | null;
  parentLocationId?: string | null;
  row?: number | null;
  col?: number | null;
}

export interface DefectInput {
  itemId?: string | null;
  locationId?: string | null;
  title: string;
  description?: string;
  severity: Severity;
  reporter?: string;
}

export const api = {
  listDepots: () => http<Depot[]>('/depots'),
  getDepot: (d: string) => http<Depot>(`/depots/${d}`),
  createDepot: (body: { name: string; description?: string }) =>
    http<Depot>('/depots', { method: 'POST', body: JSON.stringify(body) }),

  warehouse: (d: string) => http<WarehouseView>(`/depots/${d}/warehouse`),
  listLocations: (d: string) => http<Location[]>(`/depots/${d}/locations`),
  createLocation: (d: string, body: LocationInput) =>
    http<Location>(`/depots/${d}/locations`, { method: 'POST', body: JSON.stringify(body) }),
  boxContents: (d: string, l: string) => http<BoxContentsView>(`/depots/${d}/locations/${l}/contents`),

  listItems: (d: string) => http<Item[]>(`/depots/${d}/items`),
  createItem: (d: string, body: ItemInput) =>
    http<Item>(`/depots/${d}/items`, { method: 'POST', body: JSON.stringify(body) }),

  listKits: (d: string) => http<Kit[]>(`/depots/${d}/kits`),
  getKit: (d: string, k: string) => http<Kit>(`/depots/${d}/kits/${k}`),

  inventory: (d: string) => http<InventoryView>(`/depots/${d}/inventory`),

  listDefects: (d: string) => http<DefectReport[]>(`/depots/${d}/defect-reports`),
  createDefect: (d: string, body: DefectInput) =>
    http<DefectReport>(`/depots/${d}/defect-reports`, { method: 'POST', body: JSON.stringify(body) }),
  resolveDefect: (d: string, r: string) =>
    http<DefectReport>(`/depots/${d}/defect-reports/${r}/resolve`, { method: 'POST' }),
};
