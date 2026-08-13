package de.grauerreiter.jurtenburg.domain;

/**
 * Rolle einer Gruppe (und damit ihrer Mitglieder) in einem konkreten Lager.
 * Aufsteigende Rechte: VIEWER (lesen) &lt; EDITOR (bearbeiten) &lt; ADMIN (Lager verwalten).
 */
public enum DepotRole {
    VIEWER,
    EDITOR,
    ADMIN;

    /** Deckt diese Rolle die verlangte Mindestrolle ab? */
    public boolean covers(DepotRole required) {
        return this.ordinal() >= required.ordinal();
    }
}
