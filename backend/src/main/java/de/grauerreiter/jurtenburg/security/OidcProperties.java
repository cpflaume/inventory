package de.grauerreiter.jurtenburg.security;

import java.net.URI;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

/**
 * OIDC-Konfiguration (Single-Sign-On, z.B. Nextcloud). Standardmäßig <em>deaktiviert</em>:
 * ohne {@code app.oidc.enabled=true} bleibt der Login-Endpunkt aus und die App verhält sich
 * wie zuvor (nur lokale Registrierung/Login). Aktiviert man OIDC, müssen mindestens
 * {@link #issuerUri}, {@link #clientId}, {@link #clientSecret} und {@link #redirectUri}
 * gesetzt sein (siehe {@link #validate()}).
 *
 * <p>Nur der <em>Issuer</em> wird konfiguriert; die konkreten Endpunkte (authorization/token/jwks)
 * bezieht {@link OidcClientRegistrationRepository} per Discovery aus
 * {@code ${issuerUri}/.well-known/openid-configuration}.</p>
 */
@ConfigurationProperties(prefix = "app.oidc")
public class OidcProperties {

    /** Schaltet OIDC scharf. Ist die Naht deaktiviert, existiert der Login-Endpunkt nicht. */
    private boolean enabled = false;

    /** Basis-URL des IdP (ohne {@code /.well-known/...}), zugleich erwarteter {@code iss}-Claim. */
    private String issuerUri = "";

    private String clientId = "";

    private String clientSecret = "";

    /** Öffentliche Callback-URL dieser App; muss beim IdP als Redirect-URI hinterlegt sein. */
    private String redirectUri = "";

    /** Angeforderte Scopes. {@code openid} ist Pflicht; {@code groups} liefert die Gruppen. */
    private String scopes = "openid profile email groups";

    /**
     * Client-Authentisierung am Token-Endpunkt. Erlaubt: {@code client_secret_basic} (Default, von
     * Nextcloud und den meisten IdP genutzt), {@code client_secret_post} oder {@code none}
     * (öffentlicher Client, nur PKCE — dann ist kein Client-Secret nötig). Macht einen IdP-Wechsel
     * mit abweichender Methode ohne Code-Änderung möglich.
     */
    private String clientAuthMethod = "client_secret_basic";

    /** Name des Claims, aus dem die Gruppennamen gelesen werden (Nextcloud: {@code groups}). */
    private String groupsClaim = "groups";

    /** Fehlende Gruppen aus dem Claim lokal anlegen (sonst nur vorhandene verknüpfen). */
    private boolean autoCreateGroups = true;

    /**
     * URL im Frontend, an die nach erfolgreichem Login (mit App-Token im URL-Fragment) bzw. im
     * Fehlerfall zurückgeleitet wird. Leer = automatisch aus {@link #redirectUri} abgeleitet
     * (gleicher Origin + {@code /auth/callback}).
     */
    private String postLoginRedirectUri = "";

    /** Beim Login angeforderte Scopes als Liste (mind. {@code openid}). */
    public List<String> scopeList() {
        return Arrays.stream(scopes.split("[\\s,]+")).filter(s -> !s.isBlank()).toList();
    }

    /**
     * Ziel-URL nach dem Login. Ist {@link #postLoginRedirectUri} leer, wird sie aus dem Origin
     * der {@link #redirectUri} plus {@code /auth/callback} gebildet.
     */
    public String effectivePostLoginRedirectUri() {
        if (postLoginRedirectUri != null && !postLoginRedirectUri.isBlank()) {
            return postLoginRedirectUri;
        }
        URI uri = URI.create(redirectUri);
        String origin = uri.getScheme() + "://" + uri.getAuthority();
        return origin + "/auth/callback";
    }

    /** Sichere Cookies nur über HTTPS (Redirect-URI der Produktion ist https). */
    public boolean cookieSecure() {
        return redirectUri.startsWith("https://");
    }

    /**
     * Client-Auth-Methode als Spring-Konstante (siehe {@link #clientAuthMethod}). Wirft bei einem
     * unbekannten Wert — so schlägt {@link #validate()} beim Start fehl statt erst beim Login.
     */
    public ClientAuthenticationMethod clientAuthenticationMethod() {
        return switch (clientAuthMethod.trim().toLowerCase(Locale.ROOT)) {
            case "client_secret_basic" -> ClientAuthenticationMethod.CLIENT_SECRET_BASIC;
            case "client_secret_post" -> ClientAuthenticationMethod.CLIENT_SECRET_POST;
            case "none" -> ClientAuthenticationMethod.NONE;
            default -> throw new IllegalStateException("app.oidc.client-auth-method muss "
                    + "client_secret_basic, client_secret_post oder none sein: " + clientAuthMethod);
        };
    }

    /** Fail-fast beim Start, wenn OIDC aktiviert, aber unvollständig konfiguriert ist. */
    public void validate() {
        if (!enabled) {
            return;
        }
        ClientAuthenticationMethod method = clientAuthenticationMethod();
        requireSet("app.oidc.issuer-uri", issuerUri);
        requireSet("app.oidc.client-id", clientId);
        // Ein öffentlicher Client (none) authentisiert sich nur per PKCE und hat kein Secret.
        if (!ClientAuthenticationMethod.NONE.equals(method)) {
            requireSet("app.oidc.client-secret", clientSecret);
        }
        requireSet("app.oidc.redirect-uri", redirectUri);
        // HTTPS erzwingen: Discovery/JWKS/Token-Austausch (Issuer) und der Code-Rückweg
        // (Redirect-URI) laufen sonst im Klartext und wären MITM-/Abfangbar. Loopback bleibt
        // erlaubt (lokale Entwicklung/Tests).
        requireHttpsOrLoopback("app.oidc.issuer-uri", issuerUri);
        requireHttpsOrLoopback("app.oidc.redirect-uri", redirectUri);
        if (!scopeList().contains("openid")) {
            throw new IllegalStateException("app.oidc.scopes muss 'openid' enthalten.");
        }
    }

    private static void requireSet(String name, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "OIDC ist aktiviert (app.oidc.enabled=true), aber " + name + " ist nicht gesetzt.");
        }
    }

    private static void requireHttpsOrLoopback(String name, String value) {
        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(name + " ist keine gültige URL: " + value);
        }
        String host = uri.getHost();
        boolean loopback = "localhost".equals(host) || "127.0.0.1".equals(host) || "[::1]".equals(host);
        if (!"https".equalsIgnoreCase(uri.getScheme()) && !loopback) {
            throw new IllegalStateException(name + " muss HTTPS verwenden (außer localhost/127.0.0.1): " + value);
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getIssuerUri() {
        return issuerUri;
    }

    public void setIssuerUri(String issuerUri) {
        // Trailing-Slash normalisieren, damit der iss-Vergleich robust ist.
        this.issuerUri = issuerUri == null ? "" : issuerUri.replaceAll("/+$", "");
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getScopes() {
        return scopes;
    }

    public void setScopes(String scopes) {
        this.scopes = scopes;
    }

    public String getClientAuthMethod() {
        return clientAuthMethod;
    }

    public void setClientAuthMethod(String clientAuthMethod) {
        this.clientAuthMethod = clientAuthMethod == null || clientAuthMethod.isBlank()
                ? "client_secret_basic" : clientAuthMethod;
    }

    public String getGroupsClaim() {
        return groupsClaim;
    }

    public void setGroupsClaim(String groupsClaim) {
        this.groupsClaim = groupsClaim;
    }

    public boolean isAutoCreateGroups() {
        return autoCreateGroups;
    }

    public void setAutoCreateGroups(boolean autoCreateGroups) {
        this.autoCreateGroups = autoCreateGroups;
    }

    public String getPostLoginRedirectUri() {
        return postLoginRedirectUri;
    }

    public void setPostLoginRedirectUri(String postLoginRedirectUri) {
        this.postLoginRedirectUri = postLoginRedirectUri;
    }
}
