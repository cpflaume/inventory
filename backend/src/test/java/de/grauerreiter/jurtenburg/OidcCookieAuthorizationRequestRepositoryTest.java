package de.grauerreiter.jurtenburg;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import de.grauerreiter.jurtenburg.security.JwtProperties;
import de.grauerreiter.jurtenburg.security.OidcCookieAuthorizationRequestRepository;
import de.grauerreiter.jurtenburg.security.OidcProperties;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * Der zustandslose Cookie-Store muss den Authorization-Request verlustfrei durch das Cookie
 * bringen (Serialisierung + HMAC) und den {@code state} wie die Session-Variante prüfen.
 */
class OidcCookieAuthorizationRequestRepositoryTest {

    private final OidcCookieAuthorizationRequestRepository repo =
            new OidcCookieAuthorizationRequestRepository(jwtProps(), new OidcProperties());

    private static JwtProperties jwtProps() {
        JwtProperties p = new JwtProperties();
        p.setSecret("test-secret-please-change-0123456789abcdef");
        return p;
    }

    private static OAuth2AuthorizationRequest sampleRequest(String state) {
        return OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://idp.example/authorize")
                .clientId("jurtenburg")
                .redirectUri("https://app.example/api/auth/oidc/callback")
                .scope("openid", "profile")
                .state(state)
                .attributes(attrs -> {
                    attrs.put("registration_id", "oidc");
                    attrs.put("nonce", "raw-nonce");
                })
                .additionalParameters(params -> params.put("nonce", "hashed-nonce"))
                .build();
    }

    /** Der von save() gesetzte Cookie-Wert, wie ihn der Browser zurückschickt. */
    private static Cookie roundTripCookie(MockHttpServletResponse response) {
        String setCookie = response.getHeader("Set-Cookie");
        assertNotNull(setCookie, "Set-Cookie erwartet");
        String prefix = "oidc_auth=";
        int start = setCookie.indexOf(prefix) + prefix.length();
        int end = setCookie.indexOf(';', start);
        return new Cookie("oidc_auth", setCookie.substring(start, end < 0 ? setCookie.length() : end));
    }

    @Test
    void savedRequestIsLoadedBackWhenStateMatches() {
        MockHttpServletResponse saveResponse = new MockHttpServletResponse();
        OAuth2AuthorizationRequest saved = sampleRequest("state-123");
        repo.saveAuthorizationRequest(saved, new MockHttpServletRequest(), saveResponse);

        MockHttpServletRequest callback = new MockHttpServletRequest();
        callback.setParameter("state", "state-123");
        callback.setCookies(roundTripCookie(saveResponse));

        OAuth2AuthorizationRequest loaded = repo.loadAuthorizationRequest(callback);
        assertNotNull(loaded, "Request muss aus dem Cookie zurückkommen");
        assertEquals("state-123", loaded.getState());
        assertEquals("raw-nonce", loaded.getAttributes().get("nonce"));
        assertEquals("oidc", loaded.getAttributes().get("registration_id"));
    }

    @Test
    void mismatchedStateLoadsNothing() {
        MockHttpServletResponse saveResponse = new MockHttpServletResponse();
        repo.saveAuthorizationRequest(sampleRequest("state-123"), new MockHttpServletRequest(), saveResponse);

        MockHttpServletRequest callback = new MockHttpServletRequest();
        callback.setParameter("state", "some-other-state");
        callback.setCookies(roundTripCookie(saveResponse));

        assertNull(repo.loadAuthorizationRequest(callback));
    }

    @Test
    void removeReturnsRequestAndClearsCookie() {
        MockHttpServletResponse saveResponse = new MockHttpServletResponse();
        repo.saveAuthorizationRequest(sampleRequest("state-xyz"), new MockHttpServletRequest(), saveResponse);

        MockHttpServletRequest callback = new MockHttpServletRequest();
        callback.setParameter("state", "state-xyz");
        callback.setCookies(roundTripCookie(saveResponse));
        MockHttpServletResponse removeResponse = new MockHttpServletResponse();

        OAuth2AuthorizationRequest removed = repo.removeAuthorizationRequest(callback, removeResponse);
        assertNotNull(removed);
        assertEquals("state-xyz", removed.getState());
        // Cookie wird gelöscht (Max-Age 0).
        String cleared = removeResponse.getHeader("Set-Cookie");
        assertNotNull(cleared);
        org.junit.jupiter.api.Assertions.assertTrue(cleared.contains("oidc_auth=;") || cleared.contains("Max-Age=0"),
                () -> "Lösch-Cookie erwartet: " + cleared);
    }

    @Test
    void tamperedCookieIsRejected() {
        MockHttpServletResponse saveResponse = new MockHttpServletResponse();
        repo.saveAuthorizationRequest(sampleRequest("state-123"), new MockHttpServletRequest(), saveResponse);
        Cookie cookie = roundTripCookie(saveResponse);
        // Ein Zeichen im Payload kippen → HMAC passt nicht mehr.
        String value = cookie.getValue();
        char[] chars = value.toCharArray();
        chars[0] = chars[0] == 'A' ? 'B' : 'A';
        Cookie tampered = new Cookie("oidc_auth", new String(chars));

        MockHttpServletRequest callback = new MockHttpServletRequest();
        callback.setParameter("state", "state-123");
        callback.setCookies(tampered);

        assertNull(repo.loadAuthorizationRequest(callback));
    }
}
