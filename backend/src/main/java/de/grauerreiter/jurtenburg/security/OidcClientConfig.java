package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.service.AuditService;
import de.grauerreiter.jurtenburg.service.UserProvisioningService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

/**
 * Aktiviert den bibliotheksbasierten OIDC-Login — nur wenn {@code app.oidc.enabled=true}. Ist OIDC
 * aus, existiert keine dieser Beans und {@link SecurityConfig} baut die Filterkette ohne OAuth2.
 *
 * <p>Die eigentliche Protokoll-Arbeit (Authorization Code + PKCE, Token-Austausch,
 * ID-Token-/JWKS-Verifikation, Nonce, UserInfo-Merge) erledigt die Bibliothek; hier werden nur die
 * Bausteine (Discovery, zustandsloses Cookie, Handler) zusammengesteckt.</p>
 */
@Configuration
@ConditionalOnProperty(name = "app.oidc.enabled", havingValue = "true")
public class OidcClientConfig {

    /**
     * Discovery-basierte {@link ClientRegistrationRepository}. Die Konfig wird hier fail-fast
     * validiert (App bootet bei aktiviertem, aber unvollständigem OIDC gar nicht erst); die
     * eigentliche Discovery läuft verzögert bei der ersten Nutzung.
     */
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(OidcProperties props) {
        props.validate();
        return new OidcClientRegistrationRepository(props);
    }

    @Bean
    public OidcCookieAuthorizationRequestRepository oidcCookieAuthorizationRequestRepository(
            JwtProperties jwtProps, OidcProperties oidcProps) {
        return new OidcCookieAuthorizationRequestRepository(jwtProps, oidcProps);
    }

    @Bean
    public OidcAuthenticationSuccessHandler oidcAuthenticationSuccessHandler(OidcProperties props,
            JwtService jwtService, UserProvisioningService provisioning, AuditService audit) {
        return new OidcAuthenticationSuccessHandler(props, jwtService, provisioning, audit);
    }

    @Bean
    public OidcAuthenticationFailureHandler oidcAuthenticationFailureHandler(OidcProperties props) {
        return new OidcAuthenticationFailureHandler(props);
    }

    @Bean
    public OidcLoginConfigurer oidcLoginConfigurer(ClientRegistrationRepository clients,
            OidcCookieAuthorizationRequestRepository authorizationRequestRepository,
            OidcAuthenticationSuccessHandler successHandler,
            OidcAuthenticationFailureHandler failureHandler) {
        return new OidcLoginConfigurer(clients, authorizationRequestRepository, successHandler, failureHandler);
    }
}
