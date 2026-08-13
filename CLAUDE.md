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
  Material, Mängelmeldung, Drucken). Die API wird im Browser gemockt (`e2e/mocks.ts`, `page.route`),
  kein Backend nötig. Lauf: `npm run e2e` (CI installiert Chromium; lokal ggf.
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE` auf ein vorhandenes Binary setzen).

## Nicht in v1 (Folge-Features)
Nextcloud-OIDC/SSO, aktiv zusammengestellte Packliste (Soll/Ist), Foto-Anhänge an Mängeln.
Siehe `docs/nextcloud-evaluation.md`.
