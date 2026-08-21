package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.service.AuditService;
import de.grauerreiter.jurtenburg.service.UserProvisioningService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

/**
 * Abschluss des OIDC-Logins: aus dem von der Bibliothek verifizierten {@link OidcUser} (ID-Token
 * inkl. UserInfo-Merge) wird der Benutzer provisioniert und dasselbe App-JWT ausgestellt wie beim
 * lokalen Login. Weiterleitung ans Frontend mit dem Token im URL-Fragment ({@code #token=…}), das
 * die SPA übernimmt — der Rest der App bleibt so provider-unabhängig.
 */
public class OidcAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final OidcProperties props;
    private final JwtService jwtService;
    private final UserProvisioningService provisioning;
    private final AuditService audit;

    public OidcAuthenticationSuccessHandler(OidcProperties props, JwtService jwtService,
            UserProvisioningService provisioning, AuditService audit) {
        this.props = props;
        this.jwtService = jwtService;
        this.provisioning = provisioning;
        this.audit = audit;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        OidcUser user = (OidcUser) authentication.getPrincipal();
        AppUser appUser = provisioning.provisionExternalUser(AuthProvider.OIDC, user.getSubject(),
                user.getPreferredUsername(), user.getEmail(), user.getFullName(),
                groups(user), props.isAutoCreateGroups());
        String token = jwtService.generate(appUser);
        // Erfolgreichen OIDC-Login protokollieren (wie der lokale Login im AuthController).
        audit.recordLogin(appUser.getUsername(), appUser.getId(), true, AuditService.clientIp(request));
        response.sendRedirect(props.effectivePostLoginRedirectUri() + "#token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8));
    }

    /**
     * Gruppen aus dem konfigurierten Gruppen-Claim lesen. Liste oder einzelner String werden beide
     * akzeptiert (Nextcloud liefert die Gruppen typischerweise über UserInfo).
     */
    private List<String> groups(OidcUser user) {
        Object raw = user.getClaims().get(props.getGroupsClaim());
        if (raw instanceof List<?> list) {
            return list.stream().filter(Objects::nonNull).map(Object::toString).collect(Collectors.toList());
        }
        if (raw instanceof String s && !s.isBlank()) {
            return List.of(s);
        }
        return List.of();
    }
}
