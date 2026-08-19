// TS-Typen spiegeln die Backend-DTOs (siehe backend .../web/Dtos.java + Views.java).
// In einer späteren Iteration können diese aus /v3/api-docs generiert werden
// (openapi-typescript); für den Walking Skeleton handgepflegt.

export type ConditionFlag = 'GREEN' | 'YELLOW' | 'RED';
export type LocationType = 'SHELF' | 'BOX';
export type Severity = 'MACKE' | 'DEFEKT';
export type DefectStatus = 'OPEN' | 'RESOLVED';

// ---- Auth / Benutzerverwaltung ----

export type AuthProvider = 'LOCAL' | 'OIDC';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';
export type SystemRole = 'USER' | 'ADMIN';
export type DepotRole = 'VIEWER' | 'EDITOR' | 'ADMIN';

export interface GroupSummary {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserSummary {
  id: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  provider: AuthProvider;
  status: UserStatus;
  systemRole: SystemRole;
  groups: GroupSummary[];
  createdAt: string;
}

export interface DepotAccess {
  depotId: string;
  depotName: string;
  role: DepotRole;
}

export interface MeResponse {
  user: UserSummary;
  depots: DepotAccess[];
}

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

/** Öffentlicher OIDC-Status: ob SSO aktiv ist und wohin der Login-Start zeigt. */
export interface OidcConfig {
  enabled: boolean;
  loginUrl: string;
}

export interface GroupDepotMapping {
  depotId: string;
  depotName: string;
  role: DepotRole;
}

// ---- Audit-Log ----

export type AuditAction = 'LOGIN' | 'LOGIN_FAILED' | 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogView {
  id: string;
  occurredAt: string;
  action: AuditAction;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  actorUserId?: string | null;
  actorUsername?: string | null;
  depotId?: string | null;
  ipAddress?: string | null;
}

export interface AuditPage {
  content: AuditLogView[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditQuery {
  action?: AuditAction | '';
  actor?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface Depot {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  category?: string | null;
  quantity: number;
  parentItemId?: string | null;
  locationId?: string | null;
  row?: number | null;
  col?: number | null;
  conditionFlag: ConditionFlag;
  note?: string | null;
}

export interface Location {
  id: string;
  type: LocationType;
  label: string;
  gridRows?: number | null;
  gridCols?: number | null;
  parentLocationId?: string | null;
  row?: number | null;
  col?: number | null;
}

export interface KitPosition {
  id: string;
  label: string;
  targetQuantity: number;
  itemId?: string | null;
}

export interface Kit {
  id: string;
  name: string;
  description?: string | null;
  positions: KitPosition[];
}

export interface DefectReport {
  id: string;
  itemId?: string | null;
  locationId?: string | null;
  title: string;
  description?: string | null;
  severity: Severity;
  status: DefectStatus;
  reporter?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ---- Aggregierte Ansichten ----

export interface BoxView {
  id: string;
  label: string;
  itemCount: number;
  openDefects: number;
}

export interface CellView {
  row: number;
  col: number;
  box?: BoxView | null;
  looseItems: Item[];
}

export interface ShelfView {
  id: string;
  label: string;
  gridRows: number;
  gridCols: number;
  cells: CellView[];
}

export interface WarehouseView {
  shelves: ShelfView[];
  freestandingBoxes: BoxView[];
  unassignedItems: Item[];
}

export interface BoxContentsView {
  locationId: string;
  label: string;
  items: Item[];
}

export interface InventoryGroup {
  locationId?: string | null;
  locationLabel: string;
  items: Item[];
}

export interface InventoryView {
  depotName: string;
  groups: InventoryGroup[];
  totalItems: number;
}
