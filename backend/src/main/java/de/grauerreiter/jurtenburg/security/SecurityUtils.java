package de.grauerreiter.jurtenburg.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Zugriff auf den aktuellen Principal aus dem SecurityContext. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /** Aktueller Benutzer oder {@code null}, falls nicht (App-JWT-)authentifiziert. */
    public static AppUserDetails currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails details) {
            return details;
        }
        return null;
    }
}
