package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.AuditAction;
import de.grauerreiter.jurtenburg.domain.AuditLog;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;

/** DTOs für die Admin-Audit-View. */
public final class AuditDtos {

    private AuditDtos() {
    }

    /** Ein Audit-Eintrag in der Ansicht: wer, wann, was, mit welchem Ergebnis. */
    public record AuditLogView(
            UUID id,
            Instant occurredAt,
            AuditAction action,
            String method,
            String path,
            Integer statusCode,
            UUID actorUserId,
            String actorUsername,
            UUID depotId,
            String ipAddress) {

        public static AuditLogView of(AuditLog a) {
            return new AuditLogView(a.getId(), a.getOccurredAt(), a.getAction(), a.getMethod(),
                    a.getPath(), a.getStatusCode(), a.getActorUserId(), a.getActorUsername(),
                    a.getDepotId(), a.getIpAddress());
        }
    }

    /** Seitenweise Ergebnisliste inkl. Metadaten für die Paginierung im Frontend. */
    public record AuditPage(
            List<AuditLogView> content,
            int page,
            int size,
            long totalElements,
            int totalPages) {

        public static AuditPage of(Page<AuditLog> p) {
            return new AuditPage(
                    p.getContent().stream().map(AuditLogView::of).toList(),
                    p.getNumber(),
                    p.getSize(),
                    p.getTotalElements(),
                    p.getTotalPages());
        }
    }
}
