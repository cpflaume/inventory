package de.grauerreiter.jurtenburg.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.web.client.RestClient;

/**
 * Liefert die {@link ClientRegistration} des IdP für die Spring-Security-OAuth2-Client-Bibliothek.
 * Die konkreten Endpunkte (authorization/token/jwks/userinfo) kommen per OIDC-Discovery aus dem
 * Issuer; das Ergebnis wird gecacht (erste Nutzung lädt, danach in-memory).
 *
 * <p>Bewusst mit derselben Nextcloud-Toleranz wie die frühere händische Implementierung: der
 * Discovery-Abruf folgt Redirects ({@code …/.well-known} → {@code …/index.php/.well-known}) und
 * parst das JSON auch dann, wenn der IdP es fälschlich als {@code text/html} deklariert. Erst nach
 * dieser Discovery übernimmt die Bibliothek den kompletten Flow.</p>
 */
public class OidcClientRegistrationRepository implements ClientRegistrationRepository {

    /** Registrierungs-ID des einzigen (OIDC-)Clients; Teil der Login-URL {@code …/login/oidc}. */
    public static final String REGISTRATION_ID = "oidc";

    private final OidcProperties props;
    private final RestClient rest;
    private final ObjectMapper json = new ObjectMapper();

    private volatile ClientRegistration cached;

    public OidcClientRegistrationRepository(OidcProperties props) {
        this.props = props;
        // Redirects folgen: Nextcloud liefert die Discovery spec-konform unter
        // ${issuer}/.well-known/openid-configuration nur als Redirect auf den echten Endpunkt
        // (…/index.php/.well-known/openid-configuration) aus. NORMAL folgt allen Redirects außer
        // HTTPS→HTTP (kein Klartext-Downgrade).
        HttpClient httpClient = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
        this.rest = RestClient.builder().requestFactory(new JdkClientHttpRequestFactory(httpClient)).build();
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
        String url = props.getIssuerUri() + "/.well-known/openid-configuration";
        Map<String, Object> doc;
        try {
            doc = getJson(url);
        } catch (Exception ex) {
            throw new IllegalStateException("OIDC-Discovery fehlgeschlagen (" + url + "): " + ex.getMessage(), ex);
        }
        if (doc == null || doc.get("authorization_endpoint") == null || doc.get("token_endpoint") == null
                || doc.get("jwks_uri") == null) {
            throw new IllegalStateException("OIDC-Discovery lieferte unvollständige Metadaten von " + url);
        }
        ClientRegistration.Builder builder = ClientRegistration.withRegistrationId(REGISTRATION_ID)
                .clientId(props.getClientId())
                .clientSecret(props.getClientSecret())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(props.getRedirectUri())
                .scope(props.scopeList())
                .issuerUri(props.getIssuerUri())
                .authorizationUri((String) doc.get("authorization_endpoint"))
                .tokenUri((String) doc.get("token_endpoint"))
                .jwkSetUri((String) doc.get("jwks_uri"))
                .userNameAttributeName(IdTokenClaimNames.SUB);
        // userinfo_endpoint ist optional: nicht jeder IdP bietet ihn an. Fehlt er, fällt die
        // Bibliothek auf die (ggf. dünnen) ID-Token-Claims zurück.
        Object userInfo = doc.get("userinfo_endpoint");
        if (userInfo != null) {
            builder.userInfoUri(userInfo.toString());
        }
        return builder.build();
    }

    /**
     * Holt eine JSON-Ressource und parst sie selbst. Bewusst nicht über die HttpMessageConverter:
     * manche IdP (u.a. Nextcloud) liefern Discovery mit {@code Content-Type: text/html} aus, wofür
     * Spring sonst keinen Konverter auf {@code Map} findet und die Anfrage scheitert.
     */
    private Map<String, Object> getJson(String url) {
        String body = rest.get().uri(url)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(String.class);
        return parseJson(body, url);
    }

    private Map<String, Object> parseJson(String body, String source) {
        if (body == null || body.isBlank()) {
            throw new IllegalStateException("Leere Antwort von " + source);
        }
        try {
            return json.readValue(body, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            // Ein HTML-Body (Login-/Fehlerseite) statt JSON deutet darauf hin, dass unter der
            // Discovery-URL nicht der OIDC-Provider antwortet. Klarer Hinweis statt roher
            // Parser-Fehlermeldung.
            if (looksLikeHtml(body)) {
                throw new IllegalStateException("Antwort von " + source + " war HTML statt JSON – unter der"
                        + " Discovery-URL antwortet kein OpenID-Configuration-Dokument. Issuer/Discovery-URL"
                        + " des IdP prüfen.", ex);
            }
            throw new IllegalStateException("Antwort von " + source + " ist kein JSON: " + ex.getMessage(), ex);
        }
    }

    /** Ein mit {@code <} beginnender Body (HTML-/XML-Seite) ist nie JSON. */
    private static boolean looksLikeHtml(String body) {
        return body.stripLeading().startsWith("<");
    }
}
