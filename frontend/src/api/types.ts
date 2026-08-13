// TS-Typen spiegeln die Backend-DTOs (siehe backend .../web/Dtos.java + Views.java).
// In einer späteren Iteration können diese aus /v3/api-docs generiert werden
// (openapi-typescript); für den Walking Skeleton handgepflegt.

export type ConditionFlag = 'GREEN' | 'YELLOW' | 'RED';
export type LocationType = 'SHELF' | 'BOX';
export type Severity = 'MACKE' | 'DEFEKT';
export type DefectStatus = 'OPEN' | 'RESOLVED';

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
