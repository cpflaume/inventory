package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.AuditAction;
import de.grauerreiter.jurtenburg.service.AuditService;
import de.grauerreiter.jurtenburg.web.AuditDtos.AuditPage;
import java.time.Instant;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Audit-Log-Ansicht für Plattform-Admins. Der Pfad {@code /api/admin/**} ist in der
 * SecurityConfig auf die Rolle ADMIN beschränkt — Audit ist also nur für Admins sichtbar.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
public class AuditController {

    private static final int MAX_PAGE_SIZE = 200;

    private final AuditService audit;

    public AuditController(AuditService audit) {
        this.audit = audit;
    }

    /**
     * Gefilterte, seitenweise Liste der Audit-Einträge (neueste zuerst).
     *
     * @param action optionaler Aktionstyp (LOGIN, CREATE, …)
     * @param actor  optionaler Teil-String des Akteurs (Benutzername/E-Mail)
     * @param q      optionaler Teil-String des Pfads
     * @param from   optionale Untergrenze des Zeitpunkts (ISO-8601)
     * @param to     optionale Obergrenze des Zeitpunkts (ISO-8601)
     */
    @GetMapping
    public AuditPage list(
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "occurredAt"));
        return AuditPage.of(audit.search(action, actor, from, to, q, pageable));
    }
}
