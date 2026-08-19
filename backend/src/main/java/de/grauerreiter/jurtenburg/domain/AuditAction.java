package de.grauerreiter.jurtenburg.domain;

/**
 * Grobe Kategorie eines Audit-Eintrags. {@code LOGIN}/{@code LOGIN_FAILED} werden explizit
 * beim Anmelden gesetzt; {@code CREATE}/{@code UPDATE}/{@code DELETE} leitet der
 * {@code AuditFilter} generisch aus der HTTP-Methode jeder verändernden Anfrage ab
 * (POST → CREATE, PUT/PATCH → UPDATE, DELETE → DELETE).
 */
public enum AuditAction {
    LOGIN,
    LOGIN_FAILED,
    CREATE,
    UPDATE,
    DELETE
}
