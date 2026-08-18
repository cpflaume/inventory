package de.grauerreiter.jurtenburg;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import de.grauerreiter.jurtenburg.security.OidcProperties;
import de.grauerreiter.jurtenburg.security.OidcService;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

/**
 * Discovery muss auch dann funktionieren, wenn der IdP das JSON-Dokument mit einem falschen
 * {@code Content-Type} ausliefert. Nextcloud liefert {@code /.well-known/openid-configuration}
 * mit {@code text/html} aus — früher scheiterte Spring hier mangels HttpMessageConverter
 * (Regressionsschutz für den gemeldeten Fehler).
 */
class OidcServiceDiscoveryTest {

    private HttpServer idp;

    @AfterEach
    void stop() {
        if (idp != null) {
            idp.stop(0);
        }
    }

    private OidcService serviceAgainstIdp(String discoveryContentType) throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        idp.createContext("/.well-known/openid-configuration", ex -> respond(ex, discoveryContentType, """
                {
                  "issuer": "%1$s",
                  "authorization_endpoint": "%1$s/authorize",
                  "token_endpoint": "%1$s/token",
                  "jwks_uri": "%1$s/jwks"
                }""".formatted(issuer)));
        idp.start();

        OidcProperties props = new OidcProperties();
        props.setEnabled(true);
        props.setIssuerUri(issuer);
        props.setClientId("jurtenburg-test");
        props.setClientSecret("secret");
        props.setRedirectUri("http://localhost/api/auth/oidc/callback");
        return new OidcService(props);
    }

    @Test
    void discoveryWithHtmlContentTypeStillParses() throws IOException {
        // Wie Nextcloud: korrektes JSON, aber Content-Type text/html.
        OidcService service = serviceAgainstIdp("text/html");

        String url = service.buildAuthorizationRequest().url();

        assertTrue(url.startsWith("http://127.0.0.1:"), () -> "unerwartete URL: " + url);
        assertTrue(url.contains("/authorize"), () -> "authorization_endpoint aus Discovery erwartet: " + url);
    }

    @Test
    void discoveryWithJsonContentTypeStillParses() throws IOException {
        OidcService service = serviceAgainstIdp("application/json");

        String url = service.buildAuthorizationRequest().url();

        assertTrue(url.contains("/authorize"), () -> "authorization_endpoint aus Discovery erwartet: " + url);
    }

    @Test
    void nonJsonBodyFailsWithClearMessage() throws IOException {
        idp = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String issuer = "http://127.0.0.1:" + idp.getAddress().getPort();
        idp.createContext("/.well-known/openid-configuration",
                ex -> respond(ex, "text/html", "<html><body>Login</body></html>"));
        idp.start();

        OidcProperties props = new OidcProperties();
        props.setEnabled(true);
        props.setIssuerUri(issuer);
        props.setClientId("jurtenburg-test");
        props.setClientSecret("secret");
        props.setRedirectUri("http://localhost/api/auth/oidc/callback");
        OidcService service = new OidcService(props);

        assertThrows(IllegalStateException.class, service::buildAuthorizationRequest);
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
