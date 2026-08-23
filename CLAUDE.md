# CLAUDE.md — Jurtenburg

Monorepo für die Pfadfinder-Lagersoftware. **Scope endet beim Docker-Image**; Deployment läuft
über `cpflaume/copf-demo-gitops`.

## Struktur
- `backend/` — Spring Boot (Java 25, Gradle). Domäne unter `de.grauerreiter.jurtenburg`
  (`domain`, `repo`, `service`, `web`, `config`). Schema per Flyway (`src/main/resources/db/migration`).
- `frontend/` — React + Vite + TS + Tailwind. API-Client in `src/api`, Seiten in `src/pages`.
- `.github/workflows/` — `ci.yml` (Tests FE+BE), `release.yml` (Multi-Arch-Images + GitOps-Dispatch).

## Konventionen
- **Mandantentrennung**: jede fachliche Entity trägt `depot_id`; Zugriffe laufen depot-scoped
  (`getInDepot(...)` in den Services → 404 bei fremdem Lager). Neue Entities analog anlegen.
- **Auth/Rechte** (`security/`): App-JWT (HS256, jjwt) über `JwtAuthenticationFilter`; Principal
  `AppUserDetails`. Autorisierung auf Lager-Ebene zentral im `DepotAccessInterceptor` (`/api/depots/**`)
  via `AccessService` (Gruppe→Lager-Mapping, höchste Rolle gewinnt; Plattform-Admin sieht alles).
  `/api/admin/**` = Plattform-Admin. Mehrere Auth-Provider: jeder mündet im selben App-JWT. OIDC
  (Authorization Code + PKCE) nutzt die **Spring-Security-OAuth2-Client-Bibliothek** (`oauth2Login`,
  verdrahtet in `OidcLoginConfigurer`/`OidcClientConfig`, nur bei `app.oidc.enabled=true`): Discovery
  → `ClientRegistration` (`OidcClientRegistrationRepository`), zustandslos über ein HMAC-signiertes
  `oidc_auth`-Cookie (`OidcCookieAuthorizationRequestRepository`), Abschluss im
  `OidcAuthenticationSuccessHandler` → `UserProvisioningService`. Start `/api/auth/oidc/login/oidc`,
  Callback `/api/auth/oidc/callback`, Status `/api/auth/oidc/config`. Standard AUS
  (`app.oidc.enabled`), Setup siehe `docs/oidc.md`. Benutzer:
  `AppUser` (LOCAL/OIDC, PENDING→ACTIVE), `UserGroup`, `GroupDepotAccess`.
- **Aufräumorte**: `Location` mit Typ `SHELF` (Fach-Raster `gridRows`×`gridCols`, 2×1…8×8) oder
  `BOX` (im Regalfach via `parentLocationId`+`row`/`col`, sonst freistehend). Fach-Regel
  „Kiste XOR lose Items" wird in `LocationService.assertCellFree` durchgesetzt — beim Erweitern
  der Platzierung diese Regel beibehalten.
- **DTOs**: Request/Response als Records in `web/Dtos.java`, aggregierte Ansichten in `web/Views.java`.
- **Audit** (`service/AuditService`, `security/AuditFilter`): `AuditFilter` läuft in der Security-Kette
  hinter der Autorisierung und protokolliert automatisch **jede** verändernde Anfrage (POST/PUT/PATCH/DELETE)
  → neue Mutations-Endpunkte sind ohne Zutun abgedeckt. Login wird explizit im `AuthController`/OIDC-Callback
  erfasst (auch Fehlschläge). Einträge liegen in `audit_log` (denormalisierter `actor_username`, kein FK).
  Ansicht/Filter nur für Admins über `/api/admin/audit-logs` → Frontend `AuditLogPage` (Link auf der Admin-Seite).
- **Feedback** (`web/FeedbackController`, `service/FeedbackService`, `config/FeedbackProperties`):
  In-App-Feedback wird als **GitHub-Issue** im Projekt-Repo angelegt (mit Kontext: Seite, Client-/
  Gerätedetails, Navigationsverlauf). Standard AUS (`app.feedback.enabled`); Button erscheint nur, wenn
  aktiv **und** Token+Repo gesetzt. Token bleibt serverseitig; Frontend fragt nur `GET /api/feedback/config`.
  Frontend: `components/FeedbackWidget` (schwebender Button, oberste Router-Ebene), `feedback/`
  (Kontext-Sammlung). Setup siehe `docs/feedback.md`.
- **Fehler**: `ApiExceptions.NotFoundException` (404) / `BusinessRuleException` (422).
- **Bilder/Namen**: keine Modell-Kennung o.ä. in committete Artefakte.

## Häufige Befehle
```bash
docker compose up --build                        # kompletter lokaler Stack
cd backend  && ./gradlew test                    # Testcontainers-Postgres (braucht Docker)
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

### Backend-Verifikation ohne JDK 25 (z.B. Web-/CI-Sandbox mit nur JDK 21)
Ist lokal kein JDK 25 installiert (Gradle-Toolchain schlägt fehl: „Cannot find a Java installation …
matching languageVersion=25"), lässt sich das Backend trotzdem prüfen, indem die Toolchain
**vorübergehend** heruntergestuft wird — der Code ist 21-kompatibel:
1. In `backend/build.gradle` `JavaLanguageVersion.of(25)` → `of(21)` setzen.
2. Kompilieren + Unit-Tests laufen lassen. Integrationstests brauchen Docker; ohne Docker lassen sich
   Docker-freie Tests gezielt einzeln auswählen (`--tests …`).
3. **Downgrade wieder rückgängig machen** (`of(21)` → `of(25)`) — nie mit gestufter Toolchain committen.

## Tests
- Backend: `WarehouseApiTest` (End-to-end REST inkl. Fach-XOR + Mandantentrennung, Testcontainers),
  `KitApiTest` (Bausatz anlegen+listen), `AuthApiTest` (Registrierung→Freigabe→JWT→Gruppen-Zugriff),
  `AuditApiTest` (Login + verändernde Operationen werden protokolliert, Admin-only-Filteransicht).
  Integrationstests laufen als Plattform-Admin (`adminMockMvc`); `AuthApiTest` nutzt echte Tokens.
- Frontend Unit: `WarehousePage.test.tsx` (virtuelles Lager rendert Regal/Kiste/freistehend).
- Frontend E2E (`frontend/e2e/`, Playwright): ein Spec je Haupt-Use-Case (Auth/Login+Registrierung,
  Lager, virtuelles Lager, Material, Mängelmeldung, Drucken), **gegen das echte Backend** mit
  Seed-Testdaten (`APP_SEED_DEMO=true`, siehe `config/DemoDataSeeder`). Ein `globalSetup` meldet sich
  einmal als Admin an (storageState); der Auth-Spec nutzt leeren storageState. Der Playwright-`webServer` startet nur das
  Frontend (Vite, Port 5174, proxied `/api` → Backend `:8080`); das Backend muss laufen
  (lokal `docker compose up`, in CI eigener Schritt gegen einen Postgres-Service-Container).
  Lauf: `npm run e2e` (CI installiert Chromium; lokal ggf. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` setzen).
  Videos: Default nur bei fehlgeschlagenen Tests; `E2E_VIDEO=all` (bzw. `npm run e2e:video`) nimmt
  alle auf. In CI werden Videos als Artefakt `e2e-videos` hochgeladen; der `workflow_dispatch`-Input
  `record_all_videos` erzwingt die Aufzeichnung aller Videos.

## Nicht in v1 (Folge-Features)
Aktiv zusammengestellte Packliste (Soll/Ist), Foto-Anhänge an Mängeln.
Siehe `docs/nextcloud-evaluation.md`. (Nextcloud-OIDC/SSO ist inzwischen verdrahtet — `docs/oidc.md`.)
