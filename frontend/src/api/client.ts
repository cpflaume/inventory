// Schlanker, typsicherer API-Client (fetch). Basis-URL ist relativ (/api),
// im Dev über den Vite-Proxy, in Produktion über Caddy an denselben Host.
import type {
  AuditPage,
  AuditQuery,
  AuthResponse,
  BoxContentsView,
  DefectReport,
  Depot,
  DepotRole,
  GroupDepotMapping,
  GroupSummary,
  InventoryView,
  Item,
  Kit,
  KitInstantiationResult,
  Location,
  MeResponse,
  OidcConfig,
  Severity,
  SystemRole,
  UserStatus,
  UserSummary,
  WarehouseView,
} from './types';

const BASE = '/api';
const TOKEN_KEY = 'jurtenburg_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Wird von der AuthProvider gesetzt, um auf 401 zentral zu reagieren (Logout).
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (res.status === 401) {
    clearToken();
    onUnauthorized?.();
  }
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
  // ---- Auth ----
  register: (body: { email: string; displayName?: string; password: string }) =>
    http<UserSummary>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    http<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => http<MeResponse>('/auth/me'),
  oidcConfig: () => http<OidcConfig>('/auth/oidc/config'),

  // ---- Admin ----
  adminUsers: () => http<UserSummary[]>('/admin/users'),
  approveUser: (id: string) => http<UserSummary>(`/admin/users/${id}/approve`, { method: 'POST' }),
  setSystemRole: (id: string, systemRole: SystemRole) =>
    http<UserSummary>(`/admin/users/${id}/system-role`, { method: 'POST', body: JSON.stringify({ systemRole }) }),
  setUserStatus: (id: string, status: UserStatus) =>
    http<UserSummary>(`/admin/users/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  setDisplayName: (id: string, displayName: string) =>
    http<UserSummary>(`/admin/users/${id}/display-name`, { method: 'POST', body: JSON.stringify({ displayName }) }),
  addUserToGroup: (id: string, groupId: string) =>
    http<UserSummary>(`/admin/users/${id}/groups`, { method: 'POST', body: JSON.stringify({ groupId }) }),
  removeUserFromGroup: (id: string, groupId: string) =>
    http<UserSummary>(`/admin/users/${id}/groups/${groupId}`, { method: 'DELETE' }),
  deleteUser: (id: string) => http<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  adminGroups: () => http<GroupSummary[]>('/admin/groups'),
  createGroup: (body: { name: string; description?: string }) =>
    http<GroupSummary>('/admin/groups', { method: 'POST', body: JSON.stringify(body) }),
  deleteGroup: (id: string) => http<void>(`/admin/groups/${id}`, { method: 'DELETE' }),
  groupDepots: (id: string) => http<GroupDepotMapping[]>(`/admin/groups/${id}/depots`),
  mapGroupDepot: (id: string, body: { depotId: string; role: DepotRole }) =>
    http<GroupDepotMapping>(`/admin/groups/${id}/depots`, { method: 'POST', body: JSON.stringify(body) }),
  unmapGroupDepot: (id: string, depotId: string) =>
    http<void>(`/admin/groups/${id}/depots/${depotId}`, { method: 'DELETE' }),

  // ---- Audit-Log (nur Admin) ----
  auditLogs: (query: AuditQuery = {}) => {
    const params = new URLSearchParams();
    if (query.action) params.set('action', query.action);
    if (query.actor?.trim()) params.set('actor', query.actor.trim());
    if (query.q?.trim()) params.set('q', query.q.trim());
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    if (query.page != null) params.set('page', String(query.page));
    if (query.size != null) params.set('size', String(query.size));
    const qs = params.toString();
    return http<AuditPage>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // ---- Fachdaten ----
  listDepots: () => http<Depot[]>('/depots'),
  getDepot: (d: string) => http<Depot>(`/depots/${d}`),
  createDepot: (body: { name: string; description?: string }) =>
    http<Depot>('/depots', { method: 'POST', body: JSON.stringify(body) }),
  updateDepot: (d: string, body: { name: string; description?: string }) =>
    http<Depot>(`/depots/${d}`, { method: 'PUT', body: JSON.stringify(body) }),

  warehouse: (d: string) => http<WarehouseView>(`/depots/${d}/warehouse`),
  listLocations: (d: string) => http<Location[]>(`/depots/${d}/locations`),
  createLocation: (d: string, body: LocationInput) =>
    http<Location>(`/depots/${d}/locations`, { method: 'POST', body: JSON.stringify(body) }),
  deleteLocation: (d: string, l: string) =>
    http<void>(`/depots/${d}/locations/${l}`, { method: 'DELETE' }),
  boxContents: (d: string, l: string) => http<BoxContentsView>(`/depots/${d}/locations/${l}/contents`),

  listItems: (d: string) => http<Item[]>(`/depots/${d}/items`),
  createItem: (d: string, body: ItemInput) =>
    http<Item>(`/depots/${d}/items`, { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (d: string, i: string, body: ItemInput) =>
    http<Item>(`/depots/${d}/items/${i}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItem: (d: string, i: string) =>
    http<void>(`/depots/${d}/items/${i}`, { method: 'DELETE' }),

  listKits: (d: string) => http<Kit[]>(`/depots/${d}/kits`),
  getKit: (d: string, k: string) => http<Kit>(`/depots/${d}/kits/${k}`),
  instantiateKit: (d: string, k: string, boxLabel: string) =>
    http<KitInstantiationResult>(`/depots/${d}/kits/${k}/instantiate`, {
      method: 'POST',
      body: JSON.stringify({ boxLabel }),
    }),

  inventory: (d: string) => http<InventoryView>(`/depots/${d}/inventory`),

  listDefects: (d: string) => http<DefectReport[]>(`/depots/${d}/defect-reports`),
  createDefect: (d: string, body: DefectInput) =>
    http<DefectReport>(`/depots/${d}/defect-reports`, { method: 'POST', body: JSON.stringify(body) }),
  resolveDefect: (d: string, r: string) =>
    http<DefectReport>(`/depots/${d}/defect-reports/${r}/resolve`, { method: 'POST' }),
};
