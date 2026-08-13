package de.grauerreiter.jurtenburg.domain;

/**
 * Herkunft einer Identität. Bewusst offen für mehrere Auth-Provider:
 * LOCAL = lokale Registrierung (Benutzername + Passwort), OIDC = späterer
 * Single-Sign-On (z.B. Nextcloud). Jeder Provider mündet am Ende in dasselbe
 * App-JWT, damit der Rest der Anwendung provider-unabhängig bleibt.
 */
public enum AuthProvider {
    LOCAL,
    OIDC
}
