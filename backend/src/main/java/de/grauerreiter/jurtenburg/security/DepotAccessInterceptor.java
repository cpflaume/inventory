package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.domain.DepotRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Setzt die Lager-Zugriffsregeln zentral für alle {@code /api/depots/**}-Routen durch:
 * <ul>
 *   <li>{@code POST /api/depots} (Lager anlegen) → nur Plattform-Admin.</li>
 *   <li>{@code GET /api/depots/{id}/**} → mindestens VIEWER im Lager.</li>
 *   <li>schreibende Zugriffe unter einem Lager → mindestens EDITOR.</li>
 *   <li>{@code PUT/DELETE /api/depots/{id}} (Lager verwalten) → Lager-ADMIN (bzw. Plattform-Admin).</li>
 * </ul>
 * Die Liste {@code GET /api/depots} bleibt frei (der Controller filtert auf erreichbare Lager).
 */
@Component
public class DepotAccessInterceptor implements HandlerInterceptor {

    private static final String PREFIX = "/api/depots";

    private final AccessService access;

    public DepotAccessInterceptor(AccessService access) {
        this.access = access;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        if (!path.startsWith(PREFIX)) {
            return true;
        }
        String method = request.getMethod();
        AppUserDetails user = SecurityUtils.currentUser();

        // Rest hinter /api/depots: "" (Collection) oder "/{id}..."
        String rest = path.substring(PREFIX.length());
        if (rest.isEmpty() || rest.equals("/")) {
            if ("POST".equals(method)) {
                requirePlatformAdmin(user); // Lager anlegen
            }
            return true; // GET Liste: Controller filtert
        }

        // rest beginnt mit "/{depotId}[/...]"
        String[] parts = rest.substring(1).split("/", 2);
        UUID depotId;
        try {
            depotId = UUID.fromString(parts[0]);
        } catch (IllegalArgumentException ex) {
            return true; // kein UUID-Segment → Controller behandelt (z.B. 404)
        }
        boolean nested = parts.length > 1 && !parts[1].isEmpty();
        boolean safe = "GET".equals(method) || "HEAD".equals(method);

        if (safe) {
            access.requireAccess(user, depotId, DepotRole.VIEWER);
        } else if (nested) {
            access.requireAccess(user, depotId, DepotRole.EDITOR);
        } else {
            // Lager-Ressource selbst ändern/löschen.
            access.requireAccess(user, depotId, DepotRole.ADMIN);
        }
        return true;
    }

    private void requirePlatformAdmin(AppUserDetails user) {
        if (user == null || !user.isPlatformAdmin()) {
            throw new AccessDeniedException("Nur Plattform-Admins dürfen Lager anlegen.");
        }
    }
}
