package de.grauerreiter.jurtenburg.security;

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.ClientRegistrations;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

/**
 * Liefert die {@link ClientRegistration} des IdP für die Spring-Security-OAuth2-Client-Bibliothek.
 *
 * <p><strong>Warum überhaupt ein Repository?</strong> {@code oauth2Login} kennt den IdP nicht selbst,
 * sondern schlägt ihn zur Laufzeit über ein {@link ClientRegistrationRepository} nach
 * ({@code findByRegistrationId("oidc")}). Das ist der Kontrakt der Bibliothek — die frühere
 * händische Implementierung brauchte ihn nicht, weil sie die Authorize-URL und den Token-Tausch
 * selbst baute und es keine „Registration" gab.</p>
 *
 * <p><strong>Warum eigene Implementierung statt {@code InMemoryClientRegistrationRepository}?</strong>
 * Die eingebaute In-Memory-Variante ist <em>eager</em>: sie verlangt eine fertig gebaute
 * {@link ClientRegistration}, d.h. Discovery schon beim Start. Diese hier lädt <em>lazy</em> beim
 * ersten Login und cacht danach — so bootet die App auch, wenn der IdP (Nextcloud) kurz nicht
 * erreichbar ist; nur der Login schlägt in dem Fenster fehl.</p>
 *
 * <p>Die Discovery selbst macht {@link ClientRegistrations#fromIssuerLocation} (Bibliothek):
 * Abruf des {@code /.well-known/openid-configuration}, JSON-Parsing und Redirect-Folgen
 * ({@code …/.well-known} → {@code …/index.php/.well-known}, wie Nextcloud sie ausliefert) sind
 * dort das Standardverhalten — kein Eigenbau nötig. Wir setzen nur die client-spezifischen Werte
 * (ID/Secret/Redirect-URI/Scopes) auf das Ergebnis.</p>
 */
public class OidcClientRegistrationRepository implements ClientRegistrationRepository {

    /** Registrierungs-ID des einzigen (OIDC-)Clients; Teil der Login-URL {@code …/login/oidc}. */
    public static final String REGISTRATION_ID = "oidc";

    private final OidcProperties props;

    private volatile ClientRegistration cached;

    public OidcClientRegistrationRepository(OidcProperties props) {
        this.props = props;
    }

    @Override
    public ClientRegistration findByRegistrationId(String registrationId) {
        if (!REGISTRATION_ID.equals(registrationId)) {
            return null;
        }
        ClientRegistration local = cached;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (cached == null) {
                cached = discover();
            }
            return cached;
        }
    }

    private ClientRegistration discover() {
        try {
            return ClientRegistrations.fromIssuerLocation(props.getIssuerUri())
                    .registrationId(REGISTRATION_ID)
                    .clientId(props.getClientId())
                    .clientSecret(props.getClientSecret())
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri(props.getRedirectUri())
                    .scope(props.scopeList())
                    .build();
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "OIDC-Discovery fehlgeschlagen (" + props.getIssuerUri() + "): " + ex.getMessage(), ex);
        }
    }
}
