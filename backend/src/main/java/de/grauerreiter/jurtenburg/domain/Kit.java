package de.grauerreiter.jurtenburg.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Bausatz / Vorkonfiguration eines vollständigen Zelts (z.B. "Bausatz Jurte 8m").
 * Die {@link KitPosition}en definieren die druckbare Stückliste: was gehört rein
 * und in welcher Soll-Menge.
 */
@Entity
@Table(name = "kit")
public class Kit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "depot_id", nullable = false)
    private UUID depotId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @OneToMany(mappedBy = "kit", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "position_index")
    private List<KitPosition> positions = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Kit() {
    }

    public Kit(UUID depotId, String name, String description) {
        this.depotId = depotId;
        this.name = name;
        this.description = description;
    }

    public void addPosition(KitPosition position) {
        position.setKit(this);
        this.positions.add(position);
    }

    public void clearPositions() {
        this.positions.clear();
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<KitPosition> getPositions() {
        return positions;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
