package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.domain.AuditAction;
import de.grauerreiter.jurtenburg.service.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Protokolliert alle verändernden Anfragen (POST/PUT/PATCH/DELETE) unter {@code /api/**}
 * als Audit-Eintrag. Läuft innerhalb der Security-Filterkette hinter der Autorisierung,
 * daher ist der {@link AppUserDetails}-Principal (falls vorhanden) bereits gesetzt und der
 * Response-Status spiegelt das Ergebnis der Operation.
 *
 * <p>Der Login wird nicht hier, sondern explizit im Controller protokolliert (dort ist der
 * anmeldende Benutzername auch bei Fehlschlag bekannt) — dieser Pfad wird deshalb übersprungen.</p>
 */
public class AuditFilter extends OncePerRequestFilter {

    private static final Set<String> MUTATING = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final AuditService audit;

    public AuditFilter(AuditService audit) {
        this.audit = audit;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        chain.doFilter(request, response);
        try {
            maybeRecord(request, response);
        } catch (Exception ignored) {
            // Auditing darf die Anfrage nie beeinträchtigen; der Service loggt Details selbst.
        }
    }

    private void maybeRecord(HttpServletRequest request, HttpServletResponse response) {
        String method = request.getMethod();
        if (!MUTATING.contains(method)) {
            return;
        }
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/")) {
            return;
        }
        // Login wird explizit im AuthController protokolliert (inkl. Fehlschlägen).
        if (path.equals("/api/auth/login")) {
            return;
        }

        AppUserDetails principal = SecurityUtils.currentUser();
        audit.recordMutation(
                actionFor(method),
                method,
                path,
                response.getStatus(),
                principal == null ? null : principal.getUserId(),
                principal == null ? null : principal.getUsername(),
                AuditService.clientIp(request));
    }

    private static AuditAction actionFor(String method) {
        return switch (method) {
            case "POST" -> AuditAction.CREATE;
            case "DELETE" -> AuditAction.DELETE;
            default -> AuditAction.UPDATE; // PUT, PATCH
        };
    }
}
