package de.grauerreiter.jurtenburg;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import de.grauerreiter.jurtenburg.security.OidcClientRegistrationRepository;
import de.grauerreiter.jurtenburg.security.OidcProperties;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;

/**
 * Die Discovery, die die {@link ClientRegistration} für die Spring-Security-OAuth2-Client-Bibliothek
 * aufbaut, läuft über {@code ClientRegistrations.fromIssuerLocation}. Hier wird geprüft, dass die
 * Endpunkte korrekt übernommen werden und — als Nextcloud-Fall — dass die Bibliothek dem Redirect
 * {@code …/.well-known} → {@code …/index.php/.well-known} von sich aus folgt.
 */
class OidcClientRegistrationRepositoryTest {

    /** Spec-vollständiges Discovery-Dokument (Nimbus verlangt u.a. subject_types/response_types). */
    private static String metadata(String issuer) {
        return """
                {
                  "issuer": "%1$s",
                  "authorization_endpoint": "%1$s/authorize",
                  "token_endpoint": "%1$s/token",
                  "userinfo_endpoint": "%1$s/userinfo",
                  "jwks_uri": "%1$s/jwks",
                  "response_types_supported": ["code"],
                  "subject_types_supported": ["public"],
                  "id_token_signing_alg_values_supported": ["RS256"]
                }""".formatted(issuer);
    }

    private HttpServer idp;

    @AfterEach
    void stop() {
        if (idp != null) {
            idp.stop(0);
        }
    }

    private static OidcProperties props(String issuer) {
        OidcProperties props = new OidcProperties();
        props.setEnabled(true);
        props.setIssuerUri(issuer);
        props.setClientId("jurtenburg-test");
        props.setClientSecret("secret");
        props.setRedirectUri("http://localhost/api/auth/oidc/callback");
        return props;
    }

    @Test
    void resolvesEndpointsFromDiscovery() throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        idp.createContext("/.well-known/openid-configuration", ex -> respond(ex, metadata(issuer)));
        idp.start();

        ClientRegistration registration = new OidcClientRegistrationRepository(props(issuer))
                .findByRegistrationId(OidcClientRegistrationRepository.REGISTRATION_ID);

        assertTrue(registration.getProviderDetails().getAuthorizationUri().endsWith("/authorize"),
                () -> "authorization_endpoint aus Discovery erwartet: "
                        + registration.getProviderDetails().getAuthorizationUri());
        assertTrue(registration.getProviderDetails().getTokenUri().endsWith("/token"));
        assertEquals("sub", registration.getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName());
        assertEquals("jurtenburg-test", registration.getClientId());
    }

    @Test
    void unknownRegistrationIdReturnsNull() throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        idp.start();
        // Fremde Registrierungs-ID → kein Client, ohne dass überhaupt Discovery angestoßen wird.
        assertNull(new OidcClientRegistrationRepository(props(issuer)).findByRegistrationId("something-else"));
    }

    @Test
    void discoveryFollowsRedirectFromWellKnown() throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        // Wie Nextcloud: /.well-known/openid-configuration leitet auf den echten Endpunkt
        // (…/index.php/.well-known/…) um; nur dort steht das JSON. Die Bibliothek muss folgen.
        idp.createContext("/.well-known/openid-configuration", ex -> {
            ex.getResponseHeaders().add("Location", "/index.php/.well-known/openid-configuration");
            ex.sendResponseHeaders(302, -1);
            ex.close();
        });
        idp.createContext("/index.php/.well-known/openid-configuration", ex -> respond(ex, metadata(issuer)));
        idp.start();

        ClientRegistration registration = new OidcClientRegistrationRepository(props(issuer))
                .findByRegistrationId(OidcClientRegistrationRepository.REGISTRATION_ID);

        assertTrue(registration.getProviderDetails().getAuthorizationUri().endsWith("/authorize"),
                () -> "authorization_endpoint nach Redirect-Folgen erwartet: "
                        + registration.getProviderDetails().getAuthorizationUri());
    }

    private static void respond(HttpExchange ex, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}
