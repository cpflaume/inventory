package de.grauerreiter.jurtenburg.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * Eine Position einer Bausatz-Stückliste: Bezeichnung + Soll-Menge,
 * optional verknüpft mit einem konkreten {@link Item}.
 */
@Entity
@Table(name = "kit_position")
public class KitPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "kit_id", nullable = false)
    private Kit kit;

    @Column(nullable = false)
    private String label;

    @Column(name = "target_quantity", nullable = false)
    private int targetQuantity = 1;

    /** Optionaler Verweis auf ein konkretes Item im Lager. */
    @Column(name = "item_id")
    private UUID itemId;

    protected KitPosition() {
    }

    public KitPosition(String label, int targetQuantity, UUID itemId) {
        this.label = label;
        this.targetQuantity = targetQuantity;
        this.itemId = itemId;
    }

    public UUID getId() {
        return id;
    }

    public Kit getKit() {
        return kit;
    }

    public void setKit(Kit kit) {
        this.kit = kit;
    }

    public String getLabel() {
        return label;
    }

    public int getTargetQuantity() {
        return targetQuantity;
    }

    public UUID getItemId() {
        return itemId;
    }
}
