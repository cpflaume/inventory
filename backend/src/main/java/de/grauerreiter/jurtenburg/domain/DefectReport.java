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
 * Mängelmeldung: am Lagerplatz per Handy erfasst, damit kaputtes Material
 * nicht beim nächsten Auspacken wieder überrascht.
 */
@Entity
@Table(name = "defect_report")
public class DefectReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "depot_id", nullable = false)
    private UUID depotId;

    /** Betroffenes Item (optional — z.B. Mangel an einem konkreten Teil). */
    @Column(name = "item_id")
    private UUID itemId;

    /** Betroffener Ort/Kiste (optional). */
    @Column(name = "location_id")
    private UUID locationId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Severity severity = Severity.MACKE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private DefectStatus status = DefectStatus.OPEN;

    @Column
    private String reporter;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected DefectReport() {
    }

    public DefectReport(UUID depotId, String title, Severity severity) {
        this.depotId = depotId;
        this.title = title;
        this.severity = severity;
    }

    public void resolve() {
        this.status = DefectStatus.RESOLVED;
        this.resolvedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getDepotId() {
        return depotId;
    }

    public UUID getItemId() {
        return itemId;
    }

    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }

    public UUID getLocationId() {
        return locationId;
    }

    public void setLocationId(UUID locationId) {
        this.locationId = locationId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }

    public DefectStatus getStatus() {
        return status;
    }

    public String getReporter() {
        return reporter;
    }

    public void setReporter(String reporter) {
        this.reporter = reporter;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }
}
