package de.grauerreiter.jurtenburg.domain;

/**
 * Plattform-Rolle (global, unabhängig vom Lager). ADMIN darf die Admin-Konsole
 * nutzen (Benutzer freigeben, Gruppen verwalten, Gruppen auf Lager mappen) und
 * Lager anlegen. USER ist ein normaler Benutzer, dessen Lager-Zugriff sich aus
 * seinen Gruppen ergibt.
 */
public enum SystemRole {
    USER,
    ADMIN
}
