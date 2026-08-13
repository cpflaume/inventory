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
 * Ein Material/Gegenstand. Kann Teil eines übergeordneten Items sein
 * ({@code parentItemId}: Jurte → Dach, Seitenplanen, Heringe, Gestänge …)
 * und optional an einem Aufräumort liegen: in einer Kiste
 * ({@code locationId} = Box) oder lose in einem Regalfach
 * ({@code locationId} = Regal, {@code row}/{@code col} gesetzt).
 */
@Entity
@Table(name = "item")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "depot_id", nullable = false)
    private UUID depotId;

    @Column(nullable = false)
    private String name;

    @Column
    private String category;

    @Column(nullable = false)
    private int quantity = 1;

    /** Zugehörigkeit: übergeordnetes Item (z.B. die Jurte, zu der dieses Teil gehört). */
    @Column(name = "parent_item_id")
    private UUID parentItemId;

    /** Aufräumort: Kiste (BOX) oder Regal (SHELF, dann row/col gesetzt). */
    @Column(name = "location_id")
    private UUID locationId;

    /** Fach-Zeile, falls das Item lose in einem Regal liegt. */
    @Column(name = "cell_row")
    private Integer row;

    /** Fach-Spalte, falls das Item lose in einem Regal liegt. */
    @Column(name = "cell_col")
    private Integer col;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_flag", nullable = false, length = 16)
    private ConditionFlag conditionFlag = ConditionFlag.GREEN;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Item() {
    }

    public Item(UUID depotId, String name) {
        this.depotId = depotId;
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public UUID getDepotId() {
        return depotId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public UUID getParentItemId() {
        return parentItemId;
    }

    public void setParentItemId(UUID parentItemId) {
        this.parentItemId = parentItemId;
    }

    public UUID getLocationId() {
        return locationId;
    }

    public void setLocationId(UUID locationId) {
        this.locationId = locationId;
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

    public ConditionFlag getConditionFlag() {
        return conditionFlag;
    }

    public void setConditionFlag(ConditionFlag conditionFlag) {
        this.conditionFlag = conditionFlag;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
