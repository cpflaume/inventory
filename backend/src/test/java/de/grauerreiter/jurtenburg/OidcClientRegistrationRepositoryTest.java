package de.grauerreiter.jurtenburg;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
 * aufbaut, muss dieselbe Nextcloud-Toleranz haben wie zuvor: JSON auch bei falschem
 * {@code Content-Type: text/html} parsen und Redirects folgen ({@code …/.well-known} →
 * {@code …/index.php/.well-known}). Regressionsschutz für die gemeldeten Fehler.
 */
class OidcClientRegistrationRepositoryTest {

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

    private ClientRegistration registrationAgainstIdp(String discoveryContentType) throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        idp.createContext("/.well-known/openid-configuration", ex -> respond(ex, discoveryContentType, """
                {
                  "issuer": "%1$s",
                  "authorization_endpoint": "%1$s/authorize",
                  "token_endpoint": "%1$s/token",
                  "userinfo_endpoint": "%1$s/userinfo",
                  "jwks_uri": "%1$s/jwks"
                }""".formatted(issuer)));
        idp.start();
        return new OidcClientRegistrationRepository(props(issuer))
                .findByRegistrationId(OidcClientRegistrationRepository.REGISTRATION_ID);
    }

    @Test
    void discoveryWithHtmlContentTypeStillParses() throws IOException {
        // Wie Nextcloud: korrektes JSON, aber Content-Type text/html.
        ClientRegistration registration = registrationAgainstIdp("text/html");

        assertTrue(registration.getProviderDetails().getAuthorizationUri().endsWith("/authorize"),
                () -> "authorization_endpoint aus Discovery erwartet: "
                        + registration.getProviderDetails().getAuthorizationUri());
        assertTrue(registration.getProviderDetails().getTokenUri().endsWith("/token"));
        assertEquals("sub", registration.getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName());
    }

    @Test
    void discoveryWithJsonContentTypeStillParses() throws IOException {
        ClientRegistration registration = registrationAgainstIdp("application/json");

        assertTrue(registration.getProviderDetails().getAuthorizationUri().endsWith("/authorize"));
    }

    @Test
    void unknownRegistrationIdReturnsNull() throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        idp.start();
        // Fremde Registrierungs-ID → kein Client, ohne dass überhaupt Discovery angestoßen wird.
        assertEquals(null, new OidcClientRegistrationRepository(props(issuer)).findByRegistrationId("something-else"));
    }

    @Test
    void discoveryFollowsRedirectFromWellKnown() throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        // Wie Nextcloud: /.well-known/openid-configuration leitet auf den echten Endpunkt
        // (…/index.php/.well-known/…) um; nur dort steht das JSON. Der HTTP-Client muss folgen.
        idp.createContext("/.well-known/openid-configuration", ex -> {
            ex.getResponseHeaders().add("Location", "/index.php/.well-known/openid-configuration");
            ex.sendResponseHeaders(302, -1);
            ex.close();
        });
        idp.createContext("/index.php/.well-known/openid-configuration", ex -> respond(ex, "application/json", """
                {
                  "issuer": "%1$s",
                  "authorization_endpoint": "%1$s/authorize",
                  "token_endpoint": "%1$s/token",
                  "jwks_uri": "%1$s/jwks"
                }""".formatted(issuer)));
        idp.start();

        ClientRegistration registration = new OidcClientRegistrationRepository(props(issuer))
                .findByRegistrationId(OidcClientRegistrationRepository.REGISTRATION_ID);

        assertTrue(registration.getProviderDetails().getAuthorizationUri().endsWith("/authorize"),
                () -> "authorization_endpoint nach Redirect-Folgen erwartet: "
                        + registration.getProviderDetails().getAuthorizationUri());
    }

    @Test
    void htmlBodyFailsWithActionableMessage() throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        idp.createContext("/.well-known/openid-configuration",
                ex -> respond(ex, "text/html", "<!DOCTYPE html><html><body>Login</body></html>"));
        idp.start();

        OidcClientRegistrationRepository repo = new OidcClientRegistrationRepository(props(issuer));
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> repo.findByRegistrationId(OidcClientRegistrationRepository.REGISTRATION_ID));
        // Statt roher Jackson-Fehlermeldung ein Hinweis auf HTML.
        assertTrue(ex.getMessage().contains("HTML"), () -> "Hinweis auf HTML erwartet: " + ex.getMessage());
    }

    private static void respond(HttpExchange ex, String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", contentType);
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}
