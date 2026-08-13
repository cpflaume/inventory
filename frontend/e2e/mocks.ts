import type { Page, Route } from '@playwright/test';

// Kleiner In-Memory-Fake der API, im Browser über page.route eingehängt.
// Reicht für die E2E-Haupt-Use-Cases (kein echtes Backend nötig).

export interface ApiState {
  depots: Array<{ id: string; name: string; description?: string; createdAt: string }>;
  warehouse: unknown;
  items: Array<Record<string, unknown>>;
  kits: unknown[];
  defects: Array<Record<string, unknown>>;
  contents: Record<string, unknown>;
  inventory: unknown;
}

export function emptyState(): ApiState {
  return {
    depots: [{ id: 'd1', name: 'Test-Lager', createdAt: new Date().toISOString() }],
    warehouse: { shelves: [], freestandingBoxes: [], unassignedItems: [] },
    items: [],
    kits: [],
    defects: [],
    contents: {},
    inventory: { depotName: 'Test-Lager', groups: [], totalItems: 0 },
  };
}

let counter = 0;
const nextId = (p: string) => `${p}-${++counter}`;

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/**
 * Hängt einen Fake für alle /api-Routen ein. `state` kann vorab befüllt und
 * nach Interaktionen für Assertions gelesen werden.
 */
export async function mockApi(page: Page, state: ApiState = emptyState()): Promise<ApiState> {
  // Nur echte API-Aufrufe abfangen (Pfad beginnt mit /api/) — NICHT die vom
  // Vite-Dev-Server ausgelieferten Module unter /src/api/*.
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname.replace(/^\/api/, '');
    const body = req.postData() ? JSON.parse(req.postData()!) : {};

    // Collections
    if (path === '/depots' && method === 'GET') return json(route, 200, state.depots);
    if (path === '/depots' && method === 'POST') {
      const depot = { id: nextId('d'), name: body.name, description: body.description, createdAt: new Date().toISOString() };
      state.depots.push(depot);
      return json(route, 201, depot);
    }

    const m = path.match(/^\/depots\/([^/]+)(.*)$/);
    if (m) {
      const rest = m[2];
      if (rest === '' && method === 'GET') {
        return json(route, 200, state.depots.find((d) => d.id === m[1]) ?? state.depots[0]);
      }
      if (rest === '/warehouse') return json(route, 200, state.warehouse);
      if (rest === '/inventory') return json(route, 200, state.inventory);
      if (rest === '/locations') return json(route, 200, []);
      if (rest === '/kits' && method === 'GET') return json(route, 200, state.kits);
      if (rest === '/items' && method === 'GET') return json(route, 200, state.items);
      if (rest === '/items' && method === 'POST') {
        const item = { id: nextId('i'), quantity: 1, conditionFlag: 'GREEN', ...body };
        state.items.push(item);
        return json(route, 201, item);
      }
      if (rest === '/defect-reports' && method === 'GET') return json(route, 200, state.defects);
      if (rest === '/defect-reports' && method === 'POST') {
        const report = { id: nextId('r'), status: 'OPEN', createdAt: new Date().toISOString(), ...body };
        state.defects.push(report);
        return json(route, 201, report);
      }
      const contents = rest.match(/^\/locations\/([^/]+)\/contents$/);
      if (contents) {
        return json(route, 200, state.contents[contents[1]] ?? { locationId: contents[1], label: 'Kiste', items: [] });
      }
    }

    // Fallback: leere 200, damit unerwartete Calls den Test nicht hängen lassen.
    return json(route, 200, {});
  });
  return state;
}
