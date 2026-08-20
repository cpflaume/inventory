package de.grauerreiter.jurtenburg.security;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;

/**
 * Verdrahtet den OIDC-Login der Spring-Security-OAuth2-Client-Bibliothek in die Filterkette —
 * gebündelt an einer Stelle, damit {@link SecurityConfig} provider-unabhängig bleibt. Wird nur
 * aktiv, wenn {@code app.oidc.enabled=true} (siehe {@link OidcClientConfig}).
 *
 * <p>Bewahrt die Eigenheiten der bisherigen händischen Naht:
 * <ul>
 *   <li>URLs {@code /api/auth/oidc/login/oidc} (Start) und {@code /api/auth/oidc/callback} (fest,
 *       muss zeichengenau der beim IdP hinterlegten Redirect-URI entsprechen);</li>
 *   <li>PKCE auch für den vertraulichen Client (Nextcloud hat ein Secret) — explizit erzwungen;</li>
 *   <li>zustandslos über das {@link OidcCookieAuthorizationRequestRepository}.</li>
 * </ul>
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

    public OidcLoginConfigurer(ClientRegistrationRepository clients,
            OidcCookieAuthorizationRequestRepository authorizationRequestRepository,
            OidcAuthenticationSuccessHandler successHandler,
            OidcAuthenticationFailureHandler failureHandler) {
        this.clients = clients;
        this.authorizationRequestRepository = authorizationRequestRepository;
        this.successHandler = successHandler;
        this.failureHandler = failureHandler;
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
