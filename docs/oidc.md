# OIDC / Single-Sign-On (Nextcloud)

Jurtenburg unterstützt Login über einen externen OpenID-Connect-Provider (getestet gegen die
Nextcloud-App **„OpenID Connect Identity Provider"**, App-ID `oidc`). Der Flow ist der
**Authorization Code Flow mit PKCE** und läuft **zustandslos**: State, Nonce und der PKCE-Verifier
reisen signiert in einem kurzlebigen, `HttpOnly`-Cookie mit. Jeder Provider mündet am Ende in
dasselbe App-JWT wie der lokale Login.

Standardmäßig ist OIDC **deaktiviert** (`app.oidc.enabled=false`) — ohne Konfiguration verhält sich
die App wie zuvor (nur lokale Registrierung/Login).

## Ablauf

1. `GET /api/auth/oidc/login` → Weiterleitung zum IdP, State-Cookie wird gesetzt.
2. Nutzer authentisiert sich in Nextcloud.
3. IdP ruft `GET /api/auth/oidc/callback?code=…&state=…` auf.
4. Backend prüft State gegen das Cookie, tauscht den Code am Token-Endpunkt, verifiziert das
   ID-Token (Signatur via JWKS, `iss`/`aud`/`exp` sowie `nonce`), liest `sub`/`email`/
   `preferred_username`/`name` und den Gruppen-Claim.
5. `UserProvisioningService` legt den Benutzer an bzw. aktualisiert ihn (Status `ACTIVE`) und setzt
   seine Gruppen exakt auf die Claim-Gruppen.
6. Weiterleitung ans Frontend `…/auth/callback#token=<App-JWT>`; die SPA übernimmt das Token.

## Konfiguration beim IdP (Nextcloud)

Einen OIDC-Client registrieren mit:

| Feld | Wert |
|---|---|
| Client-ID | z.B. `jurtenburg` |
| Client-Secret | vom IdP erzeugt → in GitOps als Secret hinterlegen |
| Redirect-URI | **exakt** die Callback-URL dieser App, z.B. `https://jurtenburg.copf-demo.de/api/auth/oidc/callback` |
| Flow | Authorization Code (PKCE, `code_challenge_method=S256`) |
| Scopes | `openid profile email groups` |
| Claims | `email`, `name`, `preferred_username` und ein **Gruppen-Claim** (`groups`) ins ID-Token |

Die Redirect-URI muss zeichengenau übereinstimmen (`https`, kein abweichender Trailing-Slash) und
liegt bewusst unter `/api/...`, damit sie über Caddy ans Backend geroutet wird.

## Konfiguration der App (Umgebungsvariablen)

| Env | Pflicht | Bedeutung |
|---|---|---|
| `OIDC_ENABLED` | – | `true` schaltet OIDC scharf (Default `false`). |
| `OIDC_ISSUER_URI` | ✓ | Basis-URL der Nextcloud (ohne `/.well-known/...`); zugleich erwarteter `iss`. |
| `OIDC_CLIENT_ID` | ✓ | Client-ID aus dem IdP. |
| `OIDC_CLIENT_SECRET` | ✓ | Client-Secret aus dem IdP (**Secret**, nie ins Repo). |
| `OIDC_REDIRECT_URI` | ✓ | Öffentliche Callback-URL, identisch zur Redirect-URI im IdP. |
| `OIDC_SCOPES` | – | Default `openid profile email groups` (`openid` ist Pflicht). |
| `OIDC_GROUPS_CLAIM` | – | Name des Gruppen-Claims (Default `groups`). |
| `OIDC_AUTO_CREATE_GROUPS` | – | Fehlende Claim-Gruppen lokal anlegen (Default `true`). |
| `OIDC_POST_LOGIN_REDIRECT_URI` | – | Ziel im Frontend; leer = Origin der Redirect-URI + `/auth/callback`. |

Ist `OIDC_ENABLED=true`, aber eine der Pflicht-Variablen fehlt, verweigert die App den Start
(fail-fast). Das eigentliche Deployment (Env + Secret in GitOps) ist in
`cpflaume/copf-demo-gitops` beschrieben (`services/production/inventory-api.yml`, `docs/oidc.md`).
