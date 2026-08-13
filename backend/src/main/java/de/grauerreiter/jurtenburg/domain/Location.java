package de.grauerreiter.jurtenburg.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Aufräumort im virtuellen Lager.
 *
 * <p>SHELF: Regal mit Fach-Raster {@code gridRows} x {@code gridCols} (2x1 … 8x8).
 * Ein "Fach" ist keine eigene Entity, sondern die Koordinate (row, col) im Regal.</p>
 *
 * <p>BOX: Kiste. Steht entweder in einem Regalfach
 * ({@code parentLocationId} = Regal, {@code row}/{@code col} gesetzt) oder
 * freistehend ({@code parentLocationId} = null → in der UI unter den Regalen).</p>
 */
@Entity
@Table(name = "location")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "depot_id", nullable = false)
    private UUID depotId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LocationType type;

    @Column(nullable = false)
    private String label;

    /** Nur bei SHELF: Anzahl Fächer in der Höhe (1–8). */
    @Column(name = "grid_rows")
    private Integer gridRows;

    /** Nur bei SHELF: Anzahl Fächer in der Breite (1–8). */
    @Column(name = "grid_cols")
    private Integer gridCols;

    /** Nur bei BOX in einem Regal: das umgebende Regal. */
    @Column(name = "parent_location_id")
    private UUID parentLocationId;

    /** Fach-Zeile im übergeordneten Regal (0-basiert). */
    @Column(name = "cell_row")
    private Integer row;

    /** Fach-Spalte im übergeordneten Regal (0-basiert). */
    @Column(name = "cell_col")
    private Integer col;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Location() {
    }

    public Location(UUID depotId, LocationType type, String label) {
        this.depotId = depotId;
        this.type = type;
        this.label = label;
    }

    public UUID getId() {
        return id;
    }

    public UUID getDepotId() {
        return depotId;
    }

    public LocationType getType() {
        return type;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Integer getGridRows() {
        return gridRows;
    }

    public void setGridRows(Integer gridRows) {
        this.gridRows = gridRows;
    }

    public Integer getGridCols() {
        return gridCols;
    }

    public void setGridCols(Integer gridCols) {
        this.gridCols = gridCols;
    }

    public UUID getParentLocationId() {
        return parentLocationId;
    }

    public void setParentLocationId(UUID parentLocationId) {
        this.parentLocationId = parentLocationId;
    }

    public Integer getRow() {
        return row;
    }

    public void setRow(Integer row) {
        this.row = row;
    }

    public Integer getCol() {
        return col;
    }

    public void setCol(Integer col) {
        this.col = col;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
