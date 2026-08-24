package de.grauerreiter.jurtenburg.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;

/**
 * Zustandsloser {@link AuthorizationRequestRepository}: der laufende Authorization-Request
 * (State, Nonce, PKCE-Verifier) reist nicht in einer Server-Session, sondern signiert in einem
 * kurzlebigen {@code HttpOnly}-Cookie mit — damit bleibt der OIDC-Login mit der
 * {@code SessionCreationPolicy.STATELESS} der App verträglich (kein Sticky-Session-Zwang bei
 * mehreren Replicas).
 *
 * <p>Der Request wird Java-serialisiert, base64url-kodiert und mit HMAC-SHA256 (JWT-Secret)
 * integritätsgesichert. Deserialisiert wird ausschließlich nach erfolgreicher MAC-Prüfung — der
 * Cookie-Inhalt ist also stets von dieser App erzeugt (kein Deserialisierungs-Gadget-Risiko).</p>
 */
public class OidcCookieAuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    static final String COOKIE_NAME = "oidc_auth";
    private static final String COOKIE_PATH = "/api/auth/oidc";
    private static final int TTL_SECONDS = 10 * 60;
    private static final String MAC_ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64_DEC = Base64.getUrlDecoder();

    private final byte[] macKey;
    private final boolean cookieSecure;

    public OidcCookieAuthorizationRequestRepository(JwtProperties jwtProps, OidcProperties oidcProps) {
        this.macKey = jwtProps.getSecret().getBytes(StandardCharsets.UTF_8);
        this.cookieSecure = oidcProps.cookieSecure();
    }

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        String stateParameter = request.getParameter(OAuth2ParameterNames.STATE);
        if (stateParameter == null) {
            return null;
        }
        OAuth2AuthorizationRequest stored = readCookie(request);
        // Der zurückgereichte State muss zum gespeicherten passen (CSRF-Schutz) — sonst behandeln
        // wir den Request wie „nicht gefunden", exakt wie die Session-basierte Standard-Variante.
        return (stored != null && stateParameter.equals(stored.getState())) ? stored : null;
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest == null) {
            clearCookie(response);
            return;
        }
        response.addHeader("Set-Cookie", cookie(serialize(authorizationRequest), TTL_SECONDS).toString());
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
            HttpServletResponse response) {
        OAuth2AuthorizationRequest authorizationRequest = loadAuthorizationRequest(request);
        if (authorizationRequest != null) {
            clearCookie(response);
        }
        return authorizationRequest;
    }

    private void clearCookie(HttpServletResponse response) {
        response.addHeader("Set-Cookie", cookie("", 0).toString());
    }

    private ResponseCookie cookie(String value, int maxAgeSeconds) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path(COOKIE_PATH)
                .maxAge(maxAgeSeconds)
                .build();
    }

    // ---- (De-)Serialisierung + Integritätsschutz ----

    private String serialize(OAuth2AuthorizationRequest authorizationRequest) {
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                ObjectOutputStream out = new ObjectOutputStream(bytes)) {
            out.writeObject(authorizationRequest);
            out.flush();
            byte[] payload = bytes.toByteArray();
            return B64.encodeToString(payload) + "." + B64.encodeToString(mac(payload));
        } catch (Exception ex) {
            throw new IllegalStateException("OIDC-Authorization-Request konnte nicht serialisiert werden", ex);
        }
    }

    private OAuth2AuthorizationRequest readCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        String raw = Arrays.stream(cookies)
                .filter(c -> COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        int dot = raw.indexOf('.');
        if (dot < 0) {
            return null;
        }
        try {
            byte[] payload = B64_DEC.decode(raw.substring(0, dot));
            byte[] signature = B64_DEC.decode(raw.substring(dot + 1));
            if (!MessageDigest.isEqual(signature, mac(payload))) {
                return null;
            }
            try (ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(payload))) {
                return (OAuth2AuthorizationRequest) in.readObject();
            }
        } catch (Exception ex) {
            return null;
        }
    }

    private byte[] mac(byte[] payload) {
        try {
            Mac mac = Mac.getInstance(MAC_ALGORITHM);
            mac.init(new SecretKeySpec(macKey, MAC_ALGORITHM));
            return mac.doFinal(payload);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
