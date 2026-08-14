-- Vor der Umstellung „E-Mail = Benutzername" war die E-Mail optional; der beim Start
-- angelegte Bootstrap-Admin (und evtl. weitere lokale Benutzer) hat daher keine E-Mail.
-- Backfill: fehlende E-Mail = Benutzername (die Login-Identität). Damit ist der Datenbestand
-- konsistent zur neuen Regel und die UI kann die E-Mail überall anzeigen.
update app_user
set email = username
where email is null;
