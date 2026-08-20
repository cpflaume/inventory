package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.service.AuditService;
import de.grauerreiter.jurtenburg.service.UserProvisioningService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

/**
 * Definiert die OIDC-Beans — nur wenn {@code app.oidc.enabled=true}. Ist OIDC aus, existieren
 * weder diese Beans noch der {@link OidcLoginConfigurer}, und {@link SecurityConfig} baut die
 * Filterkette rein lokal (App-JWT). Die eigentliche Verdrahtung des Logins steht im
 * {@link OidcLoginConfigurer}.
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
    public OidcLoginConfigurer oidcLoginConfigurer(ClientRegistrationRepository clients, OidcProperties props,
            JwtProperties jwtProps, JwtService jwtService, UserProvisioningService provisioning, AuditService audit) {
        return new OidcLoginConfigurer(clients, props, jwtProps, jwtService, provisioning, audit);
    }
}
