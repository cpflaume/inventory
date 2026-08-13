package de.grauerreiter.jurtenburg.domain;

/**
 * Art eines Aufräumorts im virtuellen Lager.
 * SHELF = Regal mit Fach-Raster (grid_rows x grid_cols).
 * BOX   = Kiste, entweder in einem Regalfach oder freistehend.
 */
public enum LocationType {
    SHELF,
    BOX
}
