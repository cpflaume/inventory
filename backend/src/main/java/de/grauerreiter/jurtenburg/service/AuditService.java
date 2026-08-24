package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.AuditAction;
import de.grauerreiter.jurtenburg.domain.AuditLog;
import de.grauerreiter.jurtenburg.repo.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Schreibt und liest Audit-Einträge. Das Schreiben ist bewusst „best effort":
 * ein Fehler beim Protokollieren darf die eigentliche Operation nie stören.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    /** {@code /api/depots/{uuid}/...} → das betroffene Lager. */
    private static final Pattern DEPOT_IN_PATH = Pattern.compile(
            "/api/depots/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})");

    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    /**
     * Protokolliert eine verändernde HTTP-Operation. In eigener Transaktion, damit ein
     * eventueller Rollback der Fachoperation den Audit-Eintrag nicht mitnimmt.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordMutation(AuditAction action, String method, String path, int statusCode,
            UUID actorUserId, String actorUsername, String ipAddress) {
        try {
            AuditLog entry = new AuditLog(action);
            entry.setMethod(method);
            entry.setPath(truncate(path, 512));
            entry.setStatusCode(statusCode);
            entry.setActorUserId(actorUserId);
            entry.setActorUsername(actorUsername);
            entry.setDepotId(depotIdFromPath(path));
            entry.setIpAddress(truncate(ipAddress, 64));
            repo.save(entry);
        } catch (Exception ex) {
            log.warn("Audit-Eintrag konnte nicht geschrieben werden: {}", ex.getMessage());
        }
    }

    /** Protokolliert einen Login-Versuch (erfolgreich oder nicht). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLogin(String username, UUID userId, boolean success, String ipAddress) {
        try {
            AuditLog entry = new AuditLog(success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED);
            entry.setActorUserId(userId);
            entry.setActorUsername(truncate(username, 255));
            entry.setPath("/api/auth/login");
            entry.setMethod("POST");
            entry.setStatusCode(success ? 200 : 401);
            entry.setIpAddress(truncate(ipAddress, 64));
            repo.save(entry);
        } catch (Exception ex) {
            log.warn("Login-Audit-Eintrag konnte nicht geschrieben werden: {}", ex.getMessage());
        }
    }

    /** Dynamisch gefilterte, nach Zeit absteigend sortierte Seitenabfrage für die Admin-View. */
    @Transactional(readOnly = true)
    public Page<AuditLog> search(AuditAction action, String actor, Instant from, Instant to,
            String query, Pageable pageable) {
        return repo.findAll(filter(action, actor, from, to, query), pageable);
    }

    private static Specification<AuditLog> filter(AuditAction action, String actor, Instant from,
            Instant to, String query) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (actor != null && !actor.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("actorUsername")), like(actor)));
            }
            if (query != null && !query.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("path")), like(query)));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("occurredAt"), to));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }

    /** Client-IP: bevorzugt {@code X-Forwarded-For} (hinter dem Reverse-Proxy), sonst die Remote-Adresse. */
    public static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Erste Adresse der Kette ist der ursprüngliche Client.
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static UUID depotIdFromPath(String path) {
        if (path == null) {
            return null;
        }
        Matcher m = DEPOT_IN_PATH.matcher(path);
        if (m.find()) {
            try {
                return UUID.fromString(m.group(1));
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
