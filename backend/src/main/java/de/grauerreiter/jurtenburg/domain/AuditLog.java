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
 * Ein Audit-Eintrag: „wer hat wann was gemacht". Erfasst Logins und alle verändernden
 * Operationen (POST/PUT/PATCH/DELETE). Der Akteur wird denormalisiert gespeichert
 * ({@link #actorUsername}), damit der Eintrag das Löschen des Benutzers überlebt.
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AuditAction action;

    /** HTTP-Methode der auslösenden Anfrage (null bei rein fachlichen Ereignissen wie Login). */
    @Column(length = 8)
    private String method;

    /** Aufgerufener Pfad, z.B. {@code /api/depots/{id}/items}. */
    @Column(length = 512)
    private String path;

    /** HTTP-Statuscode der Antwort (Ergebnis der Operation). */
    @Column(name = "status_code")
    private Integer statusCode;

    /** Benutzer-ID des Akteurs (null bei anonymen/fehlgeschlagenen Aktionen). */
    @Column(name = "actor_user_id")
    private UUID actorUserId;

    /** Benutzername/E-Mail des Akteurs (denormalisiert, überlebt das Löschen des Benutzers). */
    @Column(name = "actor_username", length = 255)
    private String actorUsername;

    /** Betroffenes Lager, sofern aus dem Pfad ableitbar. */
    @Column(name = "depot_id")
    private UUID depotId;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    protected AuditLog() {
    }

    public AuditLog(AuditAction action) {
        this.action = action;
    }

    public UUID getId() {
        return id;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Integer getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(Integer statusCode) {
        this.statusCode = statusCode;
    }

    public UUID getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(UUID actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = actorUsername;
    }

    public UUID getDepotId() {
        return depotId;
    }

    public void setDepotId(UUID depotId) {
        this.depotId = depotId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
