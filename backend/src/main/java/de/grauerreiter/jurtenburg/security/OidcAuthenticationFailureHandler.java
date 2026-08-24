package de.grauerreiter.jurtenburg.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

/**
 * Fehlerabschluss des OIDC-Logins: leitet immer ans Frontend zurück — mit einem Fehlercode im
 * URL-Fragment ({@code #error=…}), den die SPA in eine lesbare Meldung übersetzt. So sieht der
 * Nutzer nie eine rohe 500er-Seite, wenn der IdP-Rückweg scheitert.
 */
public class OidcAuthenticationFailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(OidcAuthenticationFailureHandler.class);

    private final OidcProperties props;

    public OidcAuthenticationFailureHandler(OidcProperties props) {
        this.props = props;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException {
        log.warn("OIDC-Login fehlgeschlagen: {}", exception.getMessage());
        response.sendRedirect(props.effectivePostLoginRedirectUri() + "#error="
                + URLEncoder.encode(errorCode(exception), StandardCharsets.UTF_8));
    }

    /** Fehlercode fürs Frontend: fehlender/fremder State → {@code invalid_state}, sonst generisch. */
    private static String errorCode(AuthenticationException exception) {
        if (exception instanceof OAuth2AuthenticationException oae) {
            String code = oae.getError().getErrorCode();
            if ("authorization_request_not_found".equals(code) || code.contains("state")) {
                return "invalid_state";
            }
        }
        return "oidc_failed";
    }
}
