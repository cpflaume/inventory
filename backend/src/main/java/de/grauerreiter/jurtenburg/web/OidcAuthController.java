package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.security.JwtService;
import de.grauerreiter.jurtenburg.security.OidcProperties;
import de.grauerreiter.jurtenburg.security.OidcService;
import de.grauerreiter.jurtenburg.security.OidcService.AuthorizationRequest;
import de.grauerreiter.jurtenburg.security.OidcService.OidcIdentity;
import de.grauerreiter.jurtenburg.service.UserProvisioningService;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * OIDC-Login (Authorization Code Flow + PKCE), zustandslos:
 * <ol>
 *   <li>{@code GET /login} → leitet zum IdP weiter und legt ein signiertes, kurzlebiges
 *       State-Cookie an (State/Nonce/PKCE-Verifier).</li>
 *   <li>{@code GET /callback} → prüft State gegen Cookie, tauscht den Code, verifiziert das
 *       ID-Token, provisioniert den Benutzer und leitet mit App-JWT im URL-Fragment ans
 *       Frontend zurück.</li>
 * </ol>
 * Der Endpunkt {@code /config} verrät dem Frontend nur, ob OIDC aktiv ist.
 */
@RestController
@RequestMapping("/api/auth/oidc")
public class OidcAuthController {

    private static final Logger log = LoggerFactory.getLogger(OidcAuthController.class);
    private static final String STATE_COOKIE = "oidc_state";
    private static final String COOKIE_PATH = "/api/auth/oidc";
    private static final long STATE_TTL_MS = 10 * 60 * 1000L;

    private final OidcService oidc;
    private final OidcProperties props;
    private final JwtService jwtService;
    private final UserProvisioningService provisioning;

    public OidcAuthController(OidcService oidc, OidcProperties props, JwtService jwtService,
            UserProvisioningService provisioning) {
        this.oidc = oidc;
        this.props = props;
        this.jwtService = jwtService;
        this.provisioning = provisioning;
    }

    /** Öffentlich: sagt dem Frontend, ob der „Mit Nextcloud anmelden"-Button erscheinen soll. */
    @GetMapping("/config")
    public OidcConfig config() {
        return new OidcConfig(props.isEnabled(), COOKIE_PATH + "/login");
    }

    /** Startet den Login: Weiterleitung zum IdP, State-Cookie gesetzt. */
    @GetMapping("/login")
    public ResponseEntity<Void> login() {
        requireEnabled();
        AuthorizationRequest req = oidc.buildAuthorizationRequest();
        ResponseCookie cookie = stateCookie(
                jwtService.signOidcState(req.state(), req.nonce(), req.codeVerifier(), STATE_TTL_MS), STATE_TTL_MS);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .location(URI.create(req.url()))
                .build();
    }

    /** Callback vom IdP. Leitet immer ans Frontend zurück — mit Token oder Fehlercode im Fragment. */
    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpServletRequest request) {
        requireEnabled();
        ResponseCookie cleared = stateCookie("", 0);
        try {
            if (error != null && !error.isBlank()) {
                // Der IdP hat den Login abgelehnt (z.B. Nutzer hat abgebrochen).
                return redirect(frontend("#error=" + enc(error)), cleared);
            }
            if (code == null || state == null) {
                return redirect(frontend("#error=invalid_request"), cleared);
            }
            Claims st = readState(request);
            if (st == null || !state.equals(st.get("state", String.class))) {
                return redirect(frontend("#error=invalid_state"), cleared);
            }

            OidcIdentity id = oidc.exchangeAndVerify(code, st.get("cv", String.class), st.get("nonce", String.class));
            AppUser user = provisioning.provisionExternalUser(AuthProvider.OIDC, id.subject(),
                    id.preferredUsername(), id.email(), id.displayName(), id.groups(), props.isAutoCreateGroups());
            String token = jwtService.generate(user);
            return redirect(frontend("#token=" + enc(token)), cleared);
        } catch (Exception ex) {
            log.warn("OIDC-Callback fehlgeschlagen: {}", ex.getMessage());
            return redirect(frontend("#error=oidc_failed"), cleared);
        }
    }

    private void requireEnabled() {
        if (!props.isEnabled()) {
            throw new NotFoundException("OIDC-Login ist nicht aktiviert.");
        }
    }

    private Claims readState(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        Optional<String> raw = Arrays.stream(cookies)
                .filter(c -> STATE_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
        if (raw.isEmpty()) {
            return null;
        }
        try {
            return jwtService.parseOidcState(raw.get());
        } catch (Exception ex) {
            return null;
        }
    }

    private ResponseCookie stateCookie(String value, long ttlMs) {
        return ResponseCookie.from(STATE_COOKIE, value)
                .httpOnly(true)
                .secure(props.cookieSecure())
                .sameSite("Lax")
                .path(COOKIE_PATH)
                .maxAge(ttlMs / 1000)
                .build();
    }

    private ResponseEntity<Void> redirect(String location, ResponseCookie cookie) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .location(URI.create(location))
                .build();
    }

    private String frontend(String fragment) {
        return props.effectivePostLoginRedirectUri() + fragment;
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /** Öffentliche OIDC-Statusinfo fürs Frontend. */
    public record OidcConfig(boolean enabled, String loginUrl) {
    }
}
