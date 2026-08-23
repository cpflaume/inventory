# In-App-Feedback → GitHub-Issue

Jurtenburg blendet für angemeldete Benutzer unten rechts einen **Feedback-Button** ein (Chat-Bubble).
Ein Klick öffnet ein Popup mit einem Textfeld; nach dem Absenden erscheint kurz eine Danke-Animation,
dann schließt sich das Popup. Aus dem Feedback wird automatisch ein **GitHub-Issue** im Projekt-Repo
angelegt — angereichert um Kontext, damit die Meldung nachvollziehbar ist:

- **Gemeldet von** (angemeldeter Benutzer aus dem App-JWT),
- **Seite/URL**, wohin der Benutzer zuletzt navigiert war,
- **Client-/Gerätedetails** (Browser/User-Agent, Gerätetyp, Plattform, Sprache, Fenster-/Bildschirmgröße, Zeitzone),
- **Navigationsverlauf** der letzten Aufrufe.

**Standard: AUS** (`app.feedback.enabled=false`). Der Button erscheint nur, wenn Feedback aktiviert
**und** vollständig konfiguriert ist (Token + Repo). Der GitHub-Token bleibt ausschließlich
serverseitig — das Frontend erfährt über `GET /api/feedback/config` nur, ob der Button erscheinen soll.

## Ablauf

1. Das Frontend fragt `GET /api/feedback/config` ab (nur für angemeldete Benutzer). Ist Feedback aktiv,
   erscheint der Button.
2. Der Benutzer schreibt sein Feedback und sendet es an `POST /api/feedback` (Text + Kontext).
3. Der Server (`FeedbackService`) baut Titel und Markdown-Body und legt über die GitHub-REST-API
   (`POST /repos/{owner}/{repo}/issues`) ein Issue an. Wie jede verändernde Anfrage wird der Aufruf
   automatisch im Audit-Log erfasst.
4. Nummer und Link des Issues gehen an das Frontend zurück; das Popup zeigt die Danke-Animation.

## Konfiguration

Alle Werte über Umgebungsvariablen (siehe `application.yml`, Präfix `app.feedback`):

| Variable                       | Bedeutung                                                                 | Default                  |
| ------------------------------ | ------------------------------------------------------------------------- | ------------------------ |
| `FEEDBACK_ENABLED`             | Schaltet die Feedback-Funktion scharf.                                    | `false`                  |
| `FEEDBACK_GITHUB_TOKEN`        | GitHub-Token mit `issues:write` auf das (private) Repo.                   | –                        |
| `FEEDBACK_GITHUB_REPO`         | Ziel-Repository als `owner/repo`, z.B. `cpflaume/inventory`.              | –                        |
| `FEEDBACK_GITHUB_API_BASE_URL` | GitHub-REST-API-Basis (für GitHub Enterprise anpassbar).                  | `https://api.github.com` |
| `FEEDBACK_LABELS`              | Labels für jedes Feedback-Issue (kommagetrennt).                          | `feedback`               |

### Token (privates Repo)

Empfohlen ist ein **Fine-grained Personal Access Token** (oder ein GitHub-App-Installations-Token),
eingeschränkt auf genau das Ziel-Repo mit **Read & write** auf **Issues**. Der Token gehört in
Produktion in ein Secret (nie ins Repo). Ohne `issues:write` antwortet GitHub mit `403/404`; der
Endpunkt liefert dann eine neutrale Fehlermeldung (Details stehen im Server-Log, nie im Client).

Das Label (`feedback`) sollte im Ziel-Repo existieren; GitHub legt unbekannte Labels beim
Issue-Anlegen automatisch an.
