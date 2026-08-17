package de.grauerreiter.jurtenburg;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import jakarta.servlet.http.Cookie;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * End-to-end des OIDC-Logins gegen einen eingebetteten IdP-Stub (JDK-HttpServer): Discovery,
 * JWKS und ein per Nimbus RS256-signiertes ID-Token. Deckt den ganzen Weg ab —
 * {@code /login} (Weiterleitung + State-Cookie) → {@code /callback} (Code-Tausch, ID-Token-
 * Verifikation, Provisionierung) → App-JWT im Fragment → {@code /me} mit diesem Token.
 */
class OidcLoginApiTest extends AbstractIntegrationTest {

    @Autowired
    WebApplicationContext context;

    private static final HttpServer IDP;
    private static final String ISSUER;
    private static final RSAKey RSA_KEY;
    private static final String CLIENT_ID = "jurtenburg-test";
    // Nonce, das der IdP-Stub ins nächste ID-Token schreibt (pro Testlauf gesetzt).
    private static final AtomicReference<String> NONCE = new AtomicReference<>("");

    static {
        try {
            RSA_KEY = new RSAKeyGenerator(2048).keyID("test-key").generate();
            IDP = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            ISSUER = "http://127.0.0.1:" + IDP.getAddress().getPort();

            IDP.createContext("/.well-known/openid-configuration", ex -> respondJson(ex, """
                    {
                      "issuer": "%1$s",
                      "authorization_endpoint": "%1$s/authorize",
                      "token_endpoint": "%1$s/token",
                      "jwks_uri": "%1$s/jwks"
                    }""".formatted(ISSUER)));
            IDP.createContext("/jwks", ex -> respondJson(ex, new JWKSet(RSA_KEY.toPublicJWK()).toString(true)));
            IDP.createContext("/token", ex -> respondJson(ex, """
                    {"access_token":"a","token_type":"Bearer","expires_in":300,"id_token":"%s"}"""
                    .formatted(signIdToken())));
            IDP.start();
        } catch (Exception e) {
            throw new IllegalStateException("IdP-Stub konnte nicht starten", e);
        }
    }

    @DynamicPropertySource
    static void oidcProps(DynamicPropertyRegistry registry) {
        registry.add("app.oidc.enabled", () -> "true");
        registry.add("app.oidc.issuer-uri", () -> ISSUER);
        registry.add("app.oidc.client-id", () -> CLIENT_ID);
        registry.add("app.oidc.client-secret", () -> "test-secret");
        registry.add("app.oidc.redirect-uri", () -> "http://localhost/api/auth/oidc/callback");
        registry.add("app.oidc.groups-claim", () -> "groups");
    }

    @Test
    void fullOidcLoginProvisionsUserAndIssuesAppToken() throws Exception {
        MockMvc anon = anonymousMockMvc(context);

        // /config meldet dem Frontend: OIDC ist aktiv.
        anon.perform(get("/api/auth/oidc/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled", org.hamcrest.Matchers.is(true)));

        // 1) Login-Start → 302 zum IdP, State-Cookie gesetzt.
        var loginResult = anon.perform(get("/api/auth/oidc/login"))
                .andExpect(status().isFound())
                .andReturn();
        String location = loginResult.getResponse().getHeader("Location");
        String setCookie = loginResult.getResponse().getHeader("Set-Cookie");
        org.junit.jupiter.api.Assertions.assertNotNull(location, "Weiterleitungs-URL erwartet");
        org.junit.jupiter.api.Assertions.assertTrue(location.startsWith(ISSUER + "/authorize"));

        var params = UriComponentsBuilder.fromUriString(location).build().getQueryParams();
        String state = params.getFirst("state");
        String nonce = params.getFirst("nonce");
        org.junit.jupiter.api.Assertions.assertEquals("S256", params.getFirst("code_challenge_method"));
        org.junit.jupiter.api.Assertions.assertNotNull(params.getFirst("code_challenge"));

        // Der IdP-Stub soll dieses Nonce ins ID-Token schreiben.
        NONCE.set(nonce);
        Cookie stateCookie = new Cookie("oidc_state", cookieValue(setCookie));

        // 2) Callback → 302 ans Frontend mit App-Token im Fragment.
        var cbResult = anon.perform(get("/api/auth/oidc/callback")
                        .param("code", "dummy-auth-code")
                        .param("state", state)
                        .cookie(stateCookie))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("#token=")))
                .andReturn();
        String appToken = fragmentValue(cbResult.getResponse().getHeader("Location"), "token");
        org.junit.jupiter.api.Assertions.assertNotNull(appToken, "App-JWT im Fragment erwartet");

        // 3) Das App-JWT funktioniert: /me liefert den provisionierten OIDC-Benutzer inkl. Gruppen.
        anon.perform(get("/api/auth/me").header("Authorization", "Bearer " + appToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username", org.hamcrest.Matchers.is("scout@example.org")))
                .andExpect(jsonPath("$.user.email", org.hamcrest.Matchers.is("scout@example.org")))
                .andExpect(jsonPath("$.user.provider", org.hamcrest.Matchers.is("OIDC")))
                .andExpect(jsonPath("$.user.status", org.hamcrest.Matchers.is("ACTIVE")))
                .andExpect(jsonPath("$.user.groups.length()", org.hamcrest.Matchers.is(2)));
    }

    @Test
    void callbackWithMismatchedStateRedirectsWithError() throws Exception {
        MockMvc anon = anonymousMockMvc(context);
        String setCookie = anon.perform(get("/api/auth/oidc/login"))
                .andReturn().getResponse().getHeader("Set-Cookie");

        anon.perform(get("/api/auth/oidc/callback")
                        .param("code", "x")
                        .param("state", "not-the-cookie-state")
                        .cookie(new Cookie("oidc_state", cookieValue(setCookie))))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("#error=invalid_state")));
    }

    // ---- IdP-Stub-Helfer ----

    private static String signIdToken() {
        try {
            Instant now = Instant.now();
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .issuer(ISSUER)
                    .subject("nc-user-42")
                    .audience(CLIENT_ID)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plusSeconds(300)))
                    .claim("nonce", NONCE.get())
                    .claim("email", "scout@example.org")
                    .claim("preferred_username", "scout")
                    .claim("name", "Pfadi Scout")
                    .claim("groups", List.of("Leiter", "Team A"))
                    .build();
            SignedJWT jwt = new SignedJWT(
                    new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(RSA_KEY.getKeyID()).build(), claims);
            jwt.sign(new RSASSASigner(RSA_KEY));
            return jwt.serialize();
        } catch (Exception e) {
            throw new IllegalStateException("ID-Token-Signatur fehlgeschlagen", e);
        }
    }

    private static void respondJson(com.sun.net.httpserver.HttpExchange ex, String json) throws java.io.IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String cookieValue(String setCookieHeader) {
        // "oidc_state=<jwt>; Path=...; HttpOnly; ..." → nur den Wert vor dem ersten ';'.
        String prefix = "oidc_state=";
        int start = setCookieHeader.indexOf(prefix) + prefix.length();
        int end = setCookieHeader.indexOf(';', start);
        return setCookieHeader.substring(start, end < 0 ? setCookieHeader.length() : end);
    }

    private static String fragmentValue(String url, String key) {
        int hash = url.indexOf('#');
        if (hash < 0) {
            return null;
        }
        for (String part : url.substring(hash + 1).split("&")) {
            String[] kv = part.split("=", 2);
            if (kv.length == 2 && kv[0].equals(key)) {
                return java.net.URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
