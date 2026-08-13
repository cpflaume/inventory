# CLAUDE.md — Jurtenburg

Monorepo für die Pfadfinder-Lagersoftware. **Scope endet beim Docker-Image**; Deployment läuft
über `cpflaume/copf-demo-gitops`.

## Struktur
- `backend/` — Spring Boot (Java 21, Gradle). Domäne unter `de.grauerreiter.jurtenburg`
  (`domain`, `repo`, `service`, `web`, `config`). Schema per Flyway (`src/main/resources/db/migration`).
- `frontend/` — React + Vite + TS + Tailwind. API-Client in `src/api`, Seiten in `src/pages`.
- `.github/workflows/` — `ci.yml` (Tests FE+BE), `release.yml` (Multi-Arch-Images + GitOps-Dispatch).

## Konventionen
- **Mandantentrennung**: jede fachliche Entity trägt `depot_id`; Zugriffe laufen depot-scoped
  (`getInDepot(...)` in den Services → 404 bei fremdem Lager). Neue Entities analog anlegen.
- **Aufräumorte**: `Location` mit Typ `SHELF` (Fach-Raster `gridRows`×`gridCols`, 2×1…8×8) oder
  `BOX` (im Regalfach via `parentLocationId`+`row`/`col`, sonst freistehend). Fach-Regel
  „Kiste XOR lose Items" wird in `LocationService.assertCellFree` durchgesetzt — beim Erweitern
  der Platzierung diese Regel beibehalten.
- **DTOs**: Request/Response als Records in `web/Dtos.java`, aggregierte Ansichten in `web/Views.java`.
- **Fehler**: `ApiExceptions.NotFoundException` (404) / `BusinessRuleException` (422).
- **Bilder/Namen**: keine Modell-Kennung o.ä. in committete Artefakte.

## Häufige Befehle
```bash
docker compose up --build                        # kompletter lokaler Stack
cd backend  && ./gradlew test                    # Testcontainers-Postgres (braucht Docker)
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

## Tests
- Backend: `WarehouseApiTest` (End-to-end REST inkl. Fach-XOR + Mandantentrennung, Testcontainers),
  `KitApiTest` (Bausatz anlegen+listen).
- Frontend Unit: `WarehousePage.test.tsx` (virtuelles Lager rendert Regal/Kiste/freistehend).
- Frontend E2E (`frontend/e2e/`, Playwright): ein Spec je Haupt-Use-Case (Lager, virtuelles Lager,
  Material, Mängelmeldung, Drucken), **gegen das echte Backend** mit Seed-Testdaten
  (`APP_SEED_DEMO=true`, siehe `config/DemoDataSeeder`). Der Playwright-`webServer` startet nur das
  Frontend (Vite, Port 5174, proxied `/api` → Backend `:8080`); das Backend muss laufen
  (lokal `docker compose up`, in CI eigener Schritt gegen einen Postgres-Service-Container).
  Lauf: `npm run e2e` (CI installiert Chromium; lokal ggf. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` setzen).
  Videos: Default nur bei fehlgeschlagenen Tests; `E2E_VIDEO=all` (bzw. `npm run e2e:video`) nimmt
  alle auf. In CI werden Videos als Artefakt `e2e-videos` hochgeladen; der `workflow_dispatch`-Input
  `record_all_videos` erzwingt die Aufzeichnung aller Videos.

## Nicht in v1 (Folge-Features)
Nextcloud-OIDC/SSO, aktiv zusammengestellte Packliste (Soll/Ist), Foto-Anhänge an Mängeln.
Siehe `docs/nextcloud-evaluation.md`.
