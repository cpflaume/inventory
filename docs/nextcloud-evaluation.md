# Evaluation: „stateless arbeiten & Daten in Nextcloud speichern?"

Kurzfassung der Anforderung: prüfen, ob die Anwendung *stateless* laufen und ihre Daten in
Nextcloud ablegen könnte.

## Empfehlung

- **Fachdaten (Lager, Material, Bausätze, Aufräumorte, Mängel): in Postgres**, nicht in Nextcloud.
- **Backend zustandsbehaftet, aber horizontal skalierbar**: keine Server-Sessions, Auth über
  Token (JWT/OIDC). „Stateless" im Sinne von *keine Sitzung im App-Server* ist erreichbar und
  erwünscht — „stateless" im Sinne von *keine Datenbank* ist es für diese Domäne nicht.
- **Nextcloud sinnvoll für**: (1) **SSO/OIDC + Gruppen** (Folgeschritt der Auth), (2) optional
  **Foto-Anhänge** an Mängeln als Dateien via WebDAV. Metadaten bleiben in Postgres.

## Begründung

Die Domäne ist relational und transaktional:
- Item-Bäume (Jurte → Dach/Planen/Heringe/Gestänge), Bausatz-Stücklisten, Regal-Fach-Belegung
  mit der Regel „Fach = Kiste XOR lose Items".
- Mehrere Nutzer erfassen **gleichzeitig** Mängel und räumen um → braucht Transaktionen und
  referenzielle Integrität.
- Mandantentrennung (`depot_id`) und gefilterte Abfragen (Bestandsliste, virtuelles Lager).

Nextcloud als *primärer* Datenspeicher passt dazu nicht:
- **Files/WebDAV**: „stateless + JSON-Dateien" bedeutet Lost-Updates bei gleichzeitigem
  Schreiben, teure Voll-Lade-/Voll-Schreib-Zyklen, keine Queries, keine Integrität.
- **Nextcloud Tables/Deck (per API)**: nicht für App-Fremdzugriff mit hoher Frequenz gedacht;
  Rate-Limits, keine echten Joins/Transaktionen, Kopplung an die Nextcloud-Verfügbarkeit.

Demgegenüber stellt die GitOps-Plattform pro Service **bereits eine gemanagte Postgres-DB**
bereit (`database:`-Block → Rolle `service_database` provisioniert DB/Rolle/Passwort und reicht
sie als Env ins Backend). Das ist der erprobte Pfad (announcement-service, provisioncalculator).

## Konsequenz für den Code

- Backend hält keinen Sitzungszustand; alle Daten in Postgres (Flyway-Migrationen).
- Der Auth-Layer ist so vorbereitet, dass **Nextcloud-OIDC** als zweiter Provider andockt
  (SSO + Gruppen-Claim → lokale Gruppen/Rollen je Lager), ohne die Domäne zu ändern.
- Falls Foto-Uploads kommen: eigener Nextcloud-WebDAV-Adapter, der nur Dateien ablegt; die
  Mängel-Metadaten bleiben in Postgres.
