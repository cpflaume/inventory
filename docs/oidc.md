# OIDC / Single-Sign-On (Nextcloud)

Jurtenburg nimmt Logins über einen standardkonformen OpenID-Connect-Provider an (Zielbild:
Nextcloud-App **„OpenID Connect Identity Provider"**, App-ID `oidc`). Verwendet wird der
**Authorization Code Flow mit PKCE**, komplett **zustandslos**: State, Nonce und PKCE-Verifier
reisen signiert in einem kurzlebigen `HttpOnly`-Cookie. Am Ende steht dasselbe App-JWT wie beim
lokalen Login — der Rest der App bleibt provider-unabhängig.

**Standard: AUS** (`app.oidc.enabled=false`). Ohne Konfiguration läuft die App rein lokal.

## Ablauf

1. `GET /api/auth/oidc/login` — setzt das State-Cookie, leitet zum IdP weiter.
2. Nutzer meldet sich in Nextcloud an.
3. IdP ruft `GET /api/auth/oidc/callback?code=…&state=…` auf.
4. Backend prüft State gegen das Cookie, tauscht den Code am Token-Endpunkt und verifiziert das
   ID-Token (JWKS-Signatur, `iss`/`aud`/`exp`, `nonce`).
5. `UserProvisioningService` legt den Benutzer an bzw. aktualisiert ihn (Status `ACTIVE`) und setzt
   seine Gruppen exakt auf den Gruppen-Claim.
6. Weiterleitung ans Frontend `…/auth/callback#token=<App-JWT>`; die SPA übernimmt das Token aus
   dem Fragment.

## IdP-Client (Nextcloud)

| Feld | Wert |
|---|---|
| Client-ID | z. B. `jurtenburg` |
| Client-Secret | vom IdP erzeugt → im Deployment als Secret hinterlegen (siehe GitOps) |
| Redirect-URI | **zeichengenau** `https://jurtenburg.copf-demo.de/api/auth/oidc/callback` |
| Flow | Authorization Code, PKCE (`code_challenge_method=S256`) |
| Scopes | `openid profile email groups` |
| Claims im ID-Token | `email`, `name`, `preferred_username`, Gruppen-Claim (`groups`) |

Die Redirect-URI muss exakt stimmen (`https`, kein Trailing-Slash) und liegt bewusst unter
`/api/...` — so routet Caddy sie ohne zusätzliche Route ans Backend.

## App-Konfiguration (Env → `app.oidc.*`)

| Env | Pflicht | Bedeutung |
|---|---|---|
| `OIDC_ENABLED` | – | `true` aktiviert OIDC (Default `false`). |
| `OIDC_ISSUER_URI` | ✓ | Basis-URL der Nextcloud (z. B. `https://wolke.grauer-reiter.de`, ohne `/.well-known/...`); erwarteter `iss`. Muss HTTPS sein. |
| `OIDC_CLIENT_ID` | ✓ | Client-ID aus dem IdP. |
| `OIDC_CLIENT_SECRET` | ✓ | Client-Secret aus dem IdP — **Secret, nie ins Repo**. |
| `OIDC_REDIRECT_URI` | ✓ | Callback-URL, identisch zur Redirect-URI im IdP. |
| `OIDC_SCOPES` | – | Default `openid profile email groups` (`openid` ist Pflicht). |
| `OIDC_GROUPS_CLAIM` | – | Name des Gruppen-Claims (Default `groups`). |
| `OIDC_AUTO_CREATE_GROUPS` | – | Fehlende Claim-Gruppen lokal anlegen (Default `true`). |
| `OIDC_POST_LOGIN_REDIRECT_URI` | – | Frontend-Ziel; leer = Origin der Redirect-URI + `/auth/callback`. |

Bei `OIDC_ENABLED=true` und fehlender Pflicht-Variable startet die App nicht (fail-fast).
Deployment (Env + Client-Secret) steht in `cpflaume/copf-demo-gitops` → `docs/oidc.md`.

## Troubleshooting

- **Discovery/Token mit `Content-Type: text/html`:** Nextcloud liefert
  `/.well-known/openid-configuration` (und teils die Token-Antwort) als valides JSON aus, deklariert
  dabei aber `text/html` — entgegen RFC 8414 §3.2 (Provider-Metadaten) und RFC 6749 §5.1
  (Token-Antwort), die beide `application/json` verlangen. Der Fehler liegt also serverseitig im
  IdP; der Client kann ihn nur tolerieren. In `OidcService` erledigt das ein eigener
  JSON-Konverter (`MislabeledJsonConverter`), der die Antwort unabhängig vom `Content-Type` als JSON
  liest — die normale typisierte Deserialisierung (`.body(JSON_MAP)`) greift dadurch trotzdem.
- **Redirect auf `…/index.php/.well-known/…`:** Nextcloud stellt die Discovery spec-konform unter
  `${issuer}/.well-known/openid-configuration` bereit, leitet dort aber per HTTP-Redirect auf den
  tatsächlichen Endpunkt `${issuer}/index.php/.well-known/openid-configuration` um. `OidcService`
  folgt Redirects (außer HTTPS→HTTP), sodass die Default-URL direkt funktioniert — `OIDC_ISSUER_URI`
  bleibt die Basis-URL.
- **Discovery liefert eine HTML-Seite (`… war HTML statt JSON`):** Bekommt der Client trotz
  Redirect-Folgen HTML statt JSON, antwortet unter der Discovery-URL nicht der OIDC-Provider, sondern
  die Nextcloud-Oberfläche (Login-/Startseite). Dann Issuer/Discovery-Route des IdP prüfen (App
  „OpenID Connect Identity Provider" aktiviert? Well-Known-Redirect auf den `oidc`-Endpunkt gesetzt?).
