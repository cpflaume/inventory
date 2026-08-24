package de.grauerreiter.jurtenburg;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import de.grauerreiter.jurtenburg.security.OidcProperties;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

/** Schnelle Unit-Tests der OIDC-Konfig-Validierung (fail-fast + HTTPS-Pflicht). */
class OidcPropertiesTest {

    private static OidcProperties enabled(String issuer, String redirect) {
        OidcProperties p = new OidcProperties();
        p.setEnabled(true);
        p.setIssuerUri(issuer);
        p.setClientId("jurtenburg");
        p.setClientSecret("secret");
        p.setRedirectUri(redirect);
        return p;
    }

    @Test
    void disabledSkipsAllValidation() {
        assertDoesNotThrow(() -> new OidcProperties().validate());
    }

    @Test
    void validHttpsConfigPasses() {
        assertDoesNotThrow(() -> enabled("https://wolke.grauer-reiter.de",
                "https://jurtenburg.copf-demo.de/api/auth/oidc/callback").validate());
    }

    @Test
    void missingRequiredValueFailsFast() {
        OidcProperties p = enabled("https://wolke.grauer-reiter.de",
                "https://jurtenburg.copf-demo.de/api/auth/oidc/callback");
        p.setClientSecret("");
        assertThrows(IllegalStateException.class, p::validate);
    }

    @Test
    void plainHttpIssuerIsRejected() {
        assertThrows(IllegalStateException.class, () -> enabled("http://wolke.grauer-reiter.de",
                "https://jurtenburg.copf-demo.de/api/auth/oidc/callback").validate());
    }

    @Test
    void plainHttpRedirectIsRejected() {
        assertThrows(IllegalStateException.class, () -> enabled("https://wolke.grauer-reiter.de",
                "http://jurtenburg.copf-demo.de/api/auth/oidc/callback").validate());
    }

    @Test
    void loopbackHttpIsAllowedForLocalDev() {
        assertDoesNotThrow(() -> enabled("http://127.0.0.1:8081",
                "http://localhost/api/auth/oidc/callback").validate());
    }

    @Test
    void scopesMustContainOpenid() {
        OidcProperties p = enabled("https://wolke.grauer-reiter.de",
                "https://jurtenburg.copf-demo.de/api/auth/oidc/callback");
        p.setScopes("profile email");
        assertThrows(IllegalStateException.class, p::validate);
    }

    @Test
    void clientAuthMethodDefaultsToBasic() {
        assertEquals(ClientAuthenticationMethod.CLIENT_SECRET_BASIC,
                new OidcProperties().clientAuthenticationMethod());
    }

    @Test
    void clientAuthMethodIsConfigurable() {
        OidcProperties p = enabled("https://wolke.grauer-reiter.de",
                "https://jurtenburg.copf-demo.de/api/auth/oidc/callback");
        p.setClientAuthMethod("client_secret_post");
        assertDoesNotThrow(p::validate);
        assertEquals(ClientAuthenticationMethod.CLIENT_SECRET_POST, p.clientAuthenticationMethod());
    }

    @Test
    void unknownClientAuthMethodFailsFast() {
        OidcProperties p = enabled("https://wolke.grauer-reiter.de",
                "https://jurtenburg.copf-demo.de/api/auth/oidc/callback");
        p.setClientAuthMethod("mtls");
        assertThrows(IllegalStateException.class, p::validate);
    }

    @Test
    void publicClientNeedsNoSecret() {
        // none = öffentlicher Client (nur PKCE): Secret ist dann nicht Pflicht.
        OidcProperties p = enabled("https://wolke.grauer-reiter.de",
                "https://jurtenburg.copf-demo.de/api/auth/oidc/callback");
        p.setClientAuthMethod("none");
        p.setClientSecret("");
        assertDoesNotThrow(p::validate);
    }
}
