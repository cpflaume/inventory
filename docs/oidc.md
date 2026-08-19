# OIDC / Single-Sign-On (Nextcloud)

Jurtenburg nimmt Logins über einen standardkonformen OpenID-Connect-Provider an (Zielbild:
Nextcloud-App **„OpenID Connect Identity Provider"**, App-ID `oidc`). Verwendet wird der
**Authorization Code Flow mit PKCE**, umgesetzt mit der **Spring-Security-OAuth2-Client-Bibliothek**
(`spring-boot-starter-oauth2-client`) — die trägt die gesamte Protokoll-Arbeit (Discovery,
JWKS-Verifikation des ID-Tokens, `state`/`nonce`, PKCE, UserInfo-Merge). Der Flow bleibt
**zustandslos**: der laufende Authorization-Request (State, Nonce, PKCE-Verifier) reist nicht in
einer Server-Session, sondern signiert (HMAC-SHA256) in einem kurzlebigen `HttpOnly`-Cookie
(`oidc_auth`) — verträglich mit der `SessionCreationPolicy.STATELESS` der App. Am Ende steht dasselbe
App-JWT wie beim lokalen Login — der Rest der App bleibt provider-unabhängig.

**Standard: AUS** (`app.oidc.enabled=false`). Ohne Konfiguration läuft die App rein lokal.

## Ablauf

1. `GET /api/auth/oidc/login/oidc` — die Bibliothek legt das `oidc_auth`-Cookie an und leitet zum IdP
   weiter (die konkrete URL liefert `GET /api/auth/oidc/config` dem Frontend).
2. Nutzer meldet sich in Nextcloud an.
3. IdP ruft `GET /api/auth/oidc/callback?code=…&state=…` auf (zeichengenau die beim IdP hinterlegte
   Redirect-URI).
4. Die Bibliothek prüft `state` gegen das Cookie, tauscht den Code am Token-Endpunkt und verifiziert
   das ID-Token (JWKS-Signatur, `iss`/`aud`/`exp`, `nonce`).
5. Die Bibliothek (`OidcUserService`) ruft mit dem Access-Token den **UserInfo-Endpoint** ab und
   ergänzt die Profil-Claims (`email`, `name`, `preferred_username`, Gruppen), die viele IdP — u.a.
   Nextcloud — nicht ins ID-Token schreiben. UserInfo muss denselben `sub` liefern (OIDC Core 5.3.2),
   sonst wird die Antwort verworfen. Für die Profil-Claims hat die UserInfo-Antwort Vorrang; das
   ID-Token bleibt die verifizierte Authentifizierungs-Assertion (`sub`, `iss`, `aud`, `nonce`).
6. Der `OidcAuthenticationSuccessHandler` ruft den `UserProvisioningService`, der den Benutzer anlegt
   bzw. aktualisiert (Status `ACTIVE`) und seine Gruppen exakt auf den Gruppen-Claim setzt.
7. Weiterleitung ans Frontend `…/auth/callback#token=<App-JWT>`; die SPA übernimmt das Token aus
   dem Fragment.

## IdP-Client (Nextcloud)

| Feld | Wert |
|---|---|
| Client-ID | z. B. `jurtenburg` |
| Client-Secret | vom IdP erzeugt → im Deployment als Secret hinterlegen (siehe GitOps) |
| Redirect-URI | **zeichengenau** `https://jurtenburg.copf-demo.de/api/auth/oidc/callback` |
| Flow | Authorization Code, PKCE (`code_challenge_method=S256`) |
| Scopes | `openid profile email groups` |
| Claims (ID-Token oder UserInfo) | `email`, `name`, `preferred_username`, Gruppen-Claim (`groups`) |

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
  `/.well-known/openid-configuration` (und teils die Token-Antwort) als JSON aus, deklariert dabei
  aber `text/html`. Die Discovery (`OidcClientRegistrationRepository`) parst die Antwort selbst
  (JSON-Body statt Konverter-Auswahl über den `Content-Type`); der Token-Client
  (`OidcClientConfig#oidcTokenResponseClient`) akzeptiert `text/html` explizit als Token-Media-Type,
  sodass der Login trotzdem funktioniert.
- **Redirect auf `…/index.php/.well-known/…`:** Nextcloud stellt die Discovery spec-konform unter
  `${issuer}/.well-known/openid-configuration` bereit, leitet dort aber per HTTP-Redirect auf den
  tatsächlichen Endpunkt `${issuer}/index.php/.well-known/openid-configuration` um. Sowohl die
  Discovery als auch der Token-Client folgen Redirects (außer HTTPS→HTTP), sodass die Default-URL
  direkt funktioniert — `OIDC_ISSUER_URI` bleibt die Basis-URL.
- **E-Mail/Name landen auf „user", keine Gruppen gemappt:** Der IdP legt die Profil-Claims nicht
  ins ID-Token, sondern nur in die UserInfo-Antwort. Das Backend ruft UserInfo automatisch ab; bleibt
  das Problem, im IdP prüfen, dass die Scopes `profile email groups` freigegeben sind und der
  Gruppen-Claim (`OIDC_GROUPS_CLAIM`, Default `groups`) tatsächlich unter diesem Namen ausgeliefert
  wird. Discovery muss zudem ein `userinfo_endpoint` melden (bei Nextcloud gegeben).
- **Discovery liefert eine HTML-Seite (`… war HTML statt JSON`):** Bekommt der Client trotz
  Redirect-Folgen HTML statt JSON, antwortet unter der Discovery-URL nicht der OIDC-Provider, sondern
  die Nextcloud-Oberfläche (Login-/Startseite). Dann Issuer/Discovery-Route des IdP prüfen (App
  „OpenID Connect Identity Provider" aktiviert? Well-Known-Redirect auf den `oidc`-Endpunkt gesetzt?).
