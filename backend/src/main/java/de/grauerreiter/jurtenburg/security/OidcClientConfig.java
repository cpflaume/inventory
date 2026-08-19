package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.service.UserProvisioningService;
import java.net.http.HttpClient;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.RestClientAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.http.OAuth2ErrorResponseErrorHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.http.converter.OAuth2AccessTokenResponseHttpMessageConverter;
import org.springframework.web.client.RestClient;

/**
 * Aktiviert den bibliotheksbasierten OIDC-Login — nur wenn {@code app.oidc.enabled=true}. Ist OIDC
 * aus, existiert keine dieser Beans und {@link SecurityConfig} baut die Filterkette ohne OAuth2.
 *
 * <p>Alle Nextcloud-Toleranzen und die Zustandslosigkeit stecken in den hier zusammengesteckten
 * Bausteinen; die eigentliche Protokoll-Arbeit (Authorization Code + PKCE, Token-Austausch,
 * ID-Token-/JWKS-Verifikation, Nonce, UserInfo-Merge) erledigt die Bibliothek.</p>
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

    /**
     * Token-Response-Client, der die Token-Antwort auch dann liest, wenn Nextcloud sie fälschlich
     * als {@code text/html} deklariert (dieselbe Toleranz wie bei der Discovery). Folgt zudem
     * Redirects (JDK-HttpClient, NORMAL: kein HTTPS→HTTP-Downgrade).
     */
    @Bean
    public OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> oidcTokenResponseClient() {
        OAuth2AccessTokenResponseHttpMessageConverter tokenConverter =
                new OAuth2AccessTokenResponseHttpMessageConverter();
        tokenConverter.setSupportedMediaTypes(List.of(
                MediaType.APPLICATION_JSON,
                MediaType.TEXT_HTML,
                new MediaType("application", "*+json")));
        HttpClient httpClient = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
        // Genau die zwei Konverter des Standard-Token-Clients (Form-Request, Token-Response),
        // Letzterer aber text/html-tolerant.
        RestClient restClient = RestClient.builder()
                .configureMessageConverters(converters -> converters
                        .disableDefaults()
                        .addCustomConverter(new FormHttpMessageConverter())
                        .addCustomConverter(tokenConverter))
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .defaultStatusHandler(new OAuth2ErrorResponseErrorHandler())
                .build();
        RestClientAuthorizationCodeTokenResponseClient client =
                new RestClientAuthorizationCodeTokenResponseClient();
        client.setRestClient(restClient);
        return client;
    }

    @Bean
    public OidcAuthenticationSuccessHandler oidcAuthenticationSuccessHandler(OidcProperties props,
            JwtService jwtService, UserProvisioningService provisioning,
            de.grauerreiter.jurtenburg.service.AuditService audit) {
        return new OidcAuthenticationSuccessHandler(props, jwtService, provisioning, audit);
    }

    @Bean
    public OidcAuthenticationFailureHandler oidcAuthenticationFailureHandler(OidcProperties props) {
        return new OidcAuthenticationFailureHandler(props);
    }

    @Bean
    public OidcLoginConfigurer oidcLoginConfigurer(ClientRegistrationRepository clients,
            OidcCookieAuthorizationRequestRepository authorizationRequestRepository,
            OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> tokenResponseClient,
            OidcAuthenticationSuccessHandler successHandler,
            OidcAuthenticationFailureHandler failureHandler) {
        return new OidcLoginConfigurer(clients, authorizationRequestRepository, tokenResponseClient,
                successHandler, failureHandler);
    }
}
