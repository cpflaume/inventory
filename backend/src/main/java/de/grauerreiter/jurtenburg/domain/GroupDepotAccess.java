package de.grauerreiter.jurtenburg.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/**
 * Mapping einer Gruppe auf ein Lager mit einer Rolle. „Gruppe X darf Lager Y als
 * EDITOR" — genau diese Zeile gibt allen Mitgliedern von X Zugriff auf Y.
 */
@Entity
@Table(name = "group_depot_access",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "depot_id"}))
public class GroupDepotAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "depot_id", nullable = false)
    private UUID depotId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private DepotRole role;

    protected GroupDepotAccess() {
    }

    public GroupDepotAccess(UUID groupId, UUID depotId, DepotRole role) {
        this.groupId = groupId;
        this.depotId = depotId;
        this.role = role;
    }

    public UUID getId() {
        return id;
    }

    public UUID getGroupId() {
        return groupId;
    }

    public UUID getDepotId() {
        return depotId;
    }

    public DepotRole getRole() {
        return role;
    }

    public void setRole(DepotRole role) {
        this.role = role;
    }
}
