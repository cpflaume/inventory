package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.service.AuditService;
import de.grauerreiter.jurtenburg.service.UserProvisioningService;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;

/**
 * Zentrale OIDC-Login-Verdrahtung: hängt den bibliotheksbasierten {@code oauth2Login} in die
 * Security-Filterkette und stellt an <em>einer</em> Stelle alle Bausteine zusammen. Existiert nur,
 * wenn {@code app.oidc.enabled=true} (Bean-Definition in {@link OidcClientConfig});
 * {@link SecurityConfig} ruft {@link #configure(HttpSecurity)} auf, sofern die Bean da ist.
 *
 * <p>Der eigentliche Protokoll-Ablauf steckt in der Bibliothek; hier wird nur konfiguriert, wer
 * welche Rolle spielt:</p>
 * <pre>
 * GET /api/auth/oidc/login/oidc                          (Start, permitAll)
 *   └─ OAuth2AuthorizationRequestRedirectFilter                         [Bibliothek]
 *        ├─ ClientRegistrationRepository = OidcClientRegistrationRepository   (Discovery)
 *        ├─ AuthorizationRequestRepository = OidcCookieAuthorizationRequestRepository
 *        │      (state/nonce/PKCE zustandslos im signierten Cookie statt Session)
 *        └─ PKCE erzwungen (der Client hat ein Secret → nicht per Default aktiv)
 *   → 302 zum IdP
 *
 * GET /api/auth/oidc/callback?code&amp;state               (Rückweg, permitAll)
 *   └─ OAuth2LoginAuthenticationFilter                                  [Bibliothek]
 *        Code-Tausch · ID-Token/JWKS-Prüfung · Nonce · UserInfo-Merge
 *        ├─ Erfolg → OidcAuthenticationSuccessHandler → App-JWT im URL-#Fragment
 *        └─ Fehler → OidcAuthenticationFailureHandler → #error im Fragment
 *
 * GET /api/auth/oidc/config                              → OidcAuthController (nur „aktiv?" + Login-URL)
 * </pre>
 */
public class OidcLoginConfigurer {

    /** Basis der Login-Start-URL; die Bibliothek hängt {@code /{registrationId}} an → {@code …/login/oidc}. */
    public static final String AUTHORIZATION_BASE_URI = "/api/auth/oidc/login";
    /** Feste Callback-URL; identisch zur beim IdP hinterlegten Redirect-URI. */
    static final String CALLBACK_URI = "/api/auth/oidc/callback";

    private final ClientRegistrationRepository clients;
    private final OidcCookieAuthorizationRequestRepository authorizationRequestRepository;
    private final OidcAuthenticationSuccessHandler successHandler;
    private final OidcAuthenticationFailureHandler failureHandler;

    OidcLoginConfigurer(ClientRegistrationRepository clients, OidcProperties props, JwtProperties jwtProps,
            JwtService jwtService, UserProvisioningService provisioning, AuditService audit) {
        // Die Kollaborateure sind reines Login-Innenleben (keine anderweitig genutzten Beans),
        // daher hier direkt gebaut — so steht die ganze Verdrahtung in dieser Klasse.
        this.clients = clients;
        this.authorizationRequestRepository = new OidcCookieAuthorizationRequestRepository(jwtProps, props);
        this.successHandler = new OidcAuthenticationSuccessHandler(props, jwtService, provisioning, audit);
        this.failureHandler = new OidcAuthenticationFailureHandler(props);
    }

    public void configure(HttpSecurity http) throws Exception {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(clients, AUTHORIZATION_BASE_URI);
        // PKCE ist bei Clients mit Secret nicht per Default aktiv — hier bewusst erzwingen.
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());

        http.oauth2Login(oauth -> oauth
                .clientRegistrationRepository(clients)
                .authorizationEndpoint(endpoint -> endpoint
                        .authorizationRequestResolver(resolver)
                        .authorizationRequestRepository(authorizationRequestRepository))
                .redirectionEndpoint(endpoint -> endpoint.baseUri(CALLBACK_URI))
                .successHandler(successHandler)
                .failureHandler(failureHandler));
    }
}
