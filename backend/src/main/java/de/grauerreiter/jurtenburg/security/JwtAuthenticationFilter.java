package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.repo.AppUserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Auth-Provider "App-JWT": liest ein Bearer-Token, lädt den (noch aktiven)
 * Benutzer und setzt den {@link AppUserDetails}-Principal. Weitere Provider
 * (z.B. OIDC) würden als eigene Filter davor/dahinter andocken und am Ende
 * denselben Principal-Typ setzen.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserRepository users;

    public JwtAuthenticationFilter(JwtService jwtService, AppUserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parse(header.substring(7));
                AppUser user = users.findById(jwtService.userId(claims)).orElse(null);
                // Nur aktive Benutzer gelten als authentifiziert (freigeschaltet, nicht gesperrt).
                if (user != null && user.isActive()) {
                    AppUserDetails principal = new AppUserDetails(user);
                    var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ex) {
                logger.debug("JWT-Prüfung fehlgeschlagen: " + ex.getMessage());
            }
        }
        chain.doFilter(request, response);
    }
}
