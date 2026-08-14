package de.grauerreiter.jurtenburg.domain;

/**
 * Freischalt-Status eines Benutzers. Lokale Registrierungen starten als PENDING
 * und müssen von einem Admin freigegeben (ACTIVE) werden; nur ACTIVE-Benutzer
 * können sich anmelden. DISABLED sperrt einen Benutzer wieder.
 */
public enum UserStatus {
    PENDING,
    ACTIVE,
    DISABLED
}
