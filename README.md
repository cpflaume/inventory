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
```

## Deployment

Ein GitHub-**Release** baut beide Multi-Arch-Images, pusht sie (privat) nach GHCR und feuert je
Service ein `repository_dispatch` an das GitOps-Repo, das die Versionen bumpt und via Ansible auf
die VM ausrollt. Nötige Secrets im App-Repo: `GITOPS_DISPATCH_TOKEN` (dispatch-Recht auf das
GitOps-Repo). Im GitOps-Repo: `IMAGE_PULL_SECRET` (GHCR, `read:packages`) für die privaten Images.
