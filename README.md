# Jurtenburg 🏕️

Kleine, mobil-optimierte **Lagersoftware für Pfadfinder-Zeltmaterial**: verwaltet Jurten,
Kothen und sonstiges Material, ihre Zusammengehörigkeiten und ihren Platz im Lager — und lässt
kaputtes Material per Handy als **Mängelmeldung** erfassen, damit die Kothe beim nächsten Mal
nicht wieder mit demselben Loch ausgepackt wird.

> Monorepo. **Scope endet beim Docker-Image / Release-Artefakt.** Das Deployment auf die VM
> passiert ausschließlich über das GitOps-Repo `cpflaume/copf-demo-gitops` (Ansible + Caddy).

## Was drin ist

- **Virtuelles Lager**: Regale als konfigurierbares Fach-Raster (2×1 … 8×8), anklickbare Kisten
  (Bezeichnung immer sichtbar) und Fächer, freistehende Kisten unter den Regalen. Regel: ein Fach
  enthält **entweder eine Kiste ODER lose Gegenstände**.
- **Material** mit Zugehörigkeiten (Jurte → Dach, Seitenplanen, Heringe, Gestänge …), frei
  erweiterbar (auch ein Hammer), Zustands-Ampel (🟢🟡🔴) und Notizen.
- **Bausätze** (Vorkonfiguration eines vollständigen Zelts) als druckbare **Stückliste**.
- **Mängelmeldungen** — schnelle, daumenfreundliche Erfassung am Lagerplatz.
- **Drucken**: Stückliste (Bausatz), Bestandsliste (Lager) und **Beipackzettel** (Kisteninhalt).
- **Mandantenfähig**: ein *Lager* = ein Mandant; jede fachliche Entity trägt `depot_id`.
- **Benutzerverwaltung**: lokale Registrierung mit Admin-Freigabe, JWT-Login, Gruppen und
  Gruppe→Lager-Mapping. Der Auth-Layer ist so gebaut, dass weitere Provider (OIDC/SSO) andocken.

## Auth & Benutzerverwaltung

- **Mehrere Provider vorbereitet**: jeder Provider mündet im selben App-JWT (HS256). Aktuell:
  `LOCAL` (Benutzername/Passwort). Der OIDC-Provider dockt über `UserProvisioningService`
  (Upsert + Gruppen-Sync aus Claims) an, ohne die Domäne zu ändern.
- **Registrierung → Freigabe**: lokale Registrierungen sind `PENDING`; ein Admin gibt sie frei
  (`ACTIVE`). Nur aktive Benutzer können sich anmelden.
- **Gruppen & Zugriff**: Benutzer sind Mitglieder von Gruppen; Gruppen werden per
  `group_depot_access(group, depot, role)` auf Lager gemappt (`VIEWER`/`EDITOR`/`ADMIN`). „Gruppe X →
  Lager Y" gibt allen Mitgliedern von X Zugriff auf Y — für lokale wie OIDC-Benutzer gleich.
- **Zwei Rollen-Ebenen**: Plattform-Rolle (`USER`/`ADMIN`, steuert die Admin-Konsole + Lager-Anlegen)
  und Lager-Rolle aus den Gruppen-Mappings.
- **Admin-Konsole** (`/admin`, nur Plattform-Admin): Benutzer freigeben, Gruppen zuordnen, Gruppen
  anlegen und auf Lager mappen.

**Seed-/Bootstrap-Zugänge (Dev):** Beim Start wird ein Admin angelegt
(`APP_ADMIN_USERNAME`/`APP_ADMIN_PASSWORD`, Default `admin`/`admin12345`). Der Demo-Seed
(`APP_SEED_DEMO=true`) legt zusätzlich `max`/`max12345` (Mitglied einer Gruppe mit EDITOR-Zugriff
auf das Demo-Lager) und `neu`/`neu12345` (noch nicht freigeschaltet) an.

Geplante Folge-Features: Nextcloud-SSO (OIDC + Gruppen), aktiv zusammengestellte **Packliste**
(Soll/Ist, Verteilung auf Kisten), Foto-Anhänge an Mängeln. Siehe
[`docs/nextcloud-evaluation.md`](docs/nextcloud-evaluation.md).

## Architektur

```
inventory/
├─ backend/    Spring Boot (Java 21) · JPA/Postgres · Flyway · OpenAPI · Docker-Image → GHCR
├─ frontend/   React + Vite + TypeScript + Tailwind · nginx-Docker-Image → GHCR
├─ docker-compose.yml   lokale Dev-Umgebung (Postgres + BE + Vite-Dev)
└─ .github/workflows/   ci.yml (PR-Gate) · release.yml (Images + GitOps-Dispatch)
```

Ausgeliefert werden **zwei Docker-Images** (`inventory-api`, `inventory-fe`), beide als
**Multi-Arch (amd64 + arm64)** — die Ziel-VM ist Oracle Cloud / Ampere (ARM). In Produktion
proxied Caddy `/api/*`, `/swagger-ui*`, `/v3/api-docs*` ans Backend und alles andere an das
Frontend-Image (SPA-Fallback macht dessen nginx).

## Lokal starten

```bash
docker compose up --build
# Frontend:  http://localhost:5173
# API/Swagger: http://localhost:8080/swagger-ui/index.html
```

Das Backend legt beim Start ein Demo-Lager an (Regal, Kisten, Jurte mit Teilen, ein Bausatz,
eine Mängelmeldung), damit das virtuelle Lager sofort etwas zeigt (`APP_SEED_DEMO=false` schaltet
das ab; in Produktion aus).

### Ohne Docker

```bash
# Backend (braucht ein Postgres auf localhost:5432/jurtenburg)
cd backend && ./gradlew bootRun
# Frontend
cd frontend && npm install && npm run dev
```

## Tests

```bash
cd backend  && ./gradlew test        # JUnit + Testcontainers-Postgres (braucht Docker)
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
# Playwright-E2E gegen das echte Backend (ein Test je Haupt-Use-Case). Backend muss laufen:
docker compose up -d                 # Postgres + Backend (mit Seed) + Frontend
cd frontend && npm run e2e           # Videos nur bei Fehlern
cd frontend && npm run e2e:video     # Videos ALLER Tests aufzeichnen (E2E_VIDEO=all)
```

## Deployment

Ein GitHub-**Release** baut beide Multi-Arch-Images, pusht sie (privat) nach GHCR und feuert je
Service ein `repository_dispatch` an das GitOps-Repo, das die Versionen bumpt und via Ansible auf
die VM ausrollt. Nötige Secrets im App-Repo: `GITOPS_DISPATCH_TOKEN` (dispatch-Recht auf das
GitOps-Repo). Im GitOps-Repo: `IMAGE_PULL_SECRET` (GHCR, `read:packages`) für die privaten Images.

> **Produktion — Auth-Env:** Das Backend braucht in Produktion `JWT_SECRET` (≥ 32 Bytes) und
> starke `APP_ADMIN_PASSWORD`/`APP_ADMIN_USERNAME`. Diese müssen im GitOps-Service (`inventory-api`)
> als Env/Secret gesetzt werden (Folgeschritt im GitOps-Repo).
