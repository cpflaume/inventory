package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.web.ApiExceptions.UnauthorizedException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.ResolvableType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * OIDC-Auth-Provider (Authorization Code Flow + PKCE). Verifiziert das ID-Token des IdP
 * (Signatur via JWKS, {@code iss}/{@code aud}/{@code exp}) und liefert die identitätsstiftenden
 * Claims. Die konkreten Endpunkte kommen per Discovery aus dem Issuer; das Ergebnis wird
 * gecacht (erste Nutzung lädt, danach in-memory). Bewusst zustandslos: State, Nonce und der
 * PKCE-Verifier reisen signiert im Cookie mit (siehe {@link OidcAuthController}).
 */
@Service
public class OidcService {

    /** Deserialisierungsziel für die JSON-Antworten von Discovery und Token-Endpunkt. */
    private static final ParameterizedTypeReference<Map<String, Object>> JSON_MAP =
            new ParameterizedTypeReference<>() {};

    private final OidcProperties props;
    private final RestClient rest;
    private final SecureRandom random = new SecureRandom();

    private volatile Metadata metadata;

    public OidcService(OidcProperties props) {
        this.props = props;
        // (1) Redirects folgen: Nextcloud liefert die Discovery spec-konform unter
        //     ${issuer}/.well-known/openid-configuration nur als Redirect auf den echten Endpunkt
        //     (…/index.php/.well-known/openid-configuration) aus. Ohne Folgen bekämen wir die
        //     HTML-Redirect-Seite statt des JSON. NORMAL folgt allen Redirects außer HTTPS→HTTP
        //     (kein Klartext-Downgrade).
        // (2) Mislabeled JSON tolerieren: Discovery/Token kommen als valides JSON, aber mit
        //     Content-Type text/html (entgegen RFC 8414 §3.2 / RFC 6749 §5.1). Der JSON-Konverter
        //     unten liest daher unabhängig vom Content-Type und meldet einen HTML-Body als klaren,
        //     handlungsleitenden Fehler — sodass die Aufrufer typisiert per .body(JSON_MAP) lesen.
        HttpClient httpClient = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
        this.rest = RestClient.builder()
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .configureMessageConverters(converters -> converters.withJsonConverter(new MislabeledJsonConverter()))
                .build();
    }

    /** Fail-fast: bei aktiviertem, aber unvollständigem OIDC bootet die App gar nicht erst. */
    @jakarta.annotation.PostConstruct
    void validateConfig() {
        props.validate();
    }

    public boolean isEnabled() {
        return props.isEnabled();
    }

    /** Gecachte Discovery-Endpunkte + der aus dem JWKS aufgebaute, prüfende Decoder. */
    private record Metadata(String authorizationEndpoint, String tokenEndpoint, NimbusJwtDecoder decoder) {
    }

    /** Ergebnis eines Login-Starts: Weiterleitungs-URL zum IdP plus die Geheimnisse fürs Cookie. */
    public record AuthorizationRequest(String url, String state, String nonce, String codeVerifier) {
    }

    /** Verifizierte Identität aus dem ID-Token. */
    public record OidcIdentity(String subject, String email, String preferredUsername,
            String displayName, List<String> groups) {
    }

    private Metadata metadata() {
        Metadata local = metadata;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (metadata == null) {
                metadata = discover();
            }
            return metadata;
        }
    }

    private Metadata discover() {
        String url = props.getIssuerUri() + "/.well-known/openid-configuration";
        Map<String, Object> doc;
        try {
            doc = getJson(url);
        } catch (Exception ex) {
            throw new IllegalStateException("OIDC-Discovery fehlgeschlagen (" + url + "): " + rootMessage(ex), ex);
        }
        if (doc == null || doc.get("authorization_endpoint") == null || doc.get("token_endpoint") == null
                || doc.get("jwks_uri") == null) {
            throw new IllegalStateException("OIDC-Discovery lieferte unvollständige Metadaten von " + url);
        }
        String jwksUri = (String) doc.get("jwks_uri");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri).build();
        OAuth2TokenValidator<Jwt> validators = new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                new JwtIssuerValidator(props.getIssuerUri()),
                audienceValidator());
        decoder.setJwtValidator(validators);
        return new Metadata((String) doc.get("authorization_endpoint"), (String) doc.get("token_endpoint"), decoder);
    }

    private OAuth2TokenValidator<Jwt> audienceValidator() {
        return jwt -> jwt.getAudience() != null && jwt.getAudience().contains(props.getClientId())
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new org.springframework.security.oauth2.core.OAuth2Error(
                        "invalid_audience", "ID-Token nicht für diesen Client (aud) ausgestellt.", null));
    }

    /** Baut die Authorization-Request-URL inklusive frischem State, Nonce und PKCE-Challenge. */
    public AuthorizationRequest buildAuthorizationRequest() {
        String state = randomToken();
        String nonce = randomToken();
        String codeVerifier = randomToken();
        String codeChallenge = s256(codeVerifier);
        String url = UriComponentsBuilder.fromUriString(metadata().authorizationEndpoint())
                .queryParam("response_type", "code")
                .queryParam("client_id", props.getClientId())
                .queryParam("redirect_uri", props.getRedirectUri())
                .queryParam("scope", String.join(" ", props.scopeList()))
                .queryParam("state", state)
                .queryParam("nonce", nonce)
                .queryParam("code_challenge", codeChallenge)
                .queryParam("code_challenge_method", "S256")
                .build()
                .encode()
                .toUriString();
        return new AuthorizationRequest(url, state, nonce, codeVerifier);
    }

    /**
     * Tauscht den Authorization-Code gegen Tokens, verifiziert das ID-Token (Signatur/iss/aud/exp)
     * und prüft den Nonce. Wirft {@link UnauthorizedException}, wenn etwas nicht stimmt.
     */
    public OidcIdentity exchangeAndVerify(String code, String codeVerifier, String expectedNonce) {
        Metadata meta = metadata();
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", props.getRedirectUri());
        form.add("code_verifier", codeVerifier);

        Map<String, Object> tokens;
        try {
            tokens = postForm(meta.tokenEndpoint(), form);
        } catch (Exception ex) {
            throw new UnauthorizedException("OIDC-Token-Austausch fehlgeschlagen: " + rootMessage(ex));
        }
        Object idTokenRaw = tokens == null ? null : tokens.get("id_token");
        if (idTokenRaw == null) {
            throw new UnauthorizedException("OIDC-Antwort enthielt kein id_token.");
        }

        Jwt idToken;
        try {
            idToken = meta.decoder().decode(idTokenRaw.toString());
        } catch (Exception ex) {
            throw new UnauthorizedException("ID-Token ungültig: " + ex.getMessage());
        }
        // Nonce bindet dieses ID-Token an genau diesen Login-Start (Replay-Schutz).
        if (expectedNonce == null || !expectedNonce.equals(idToken.getClaimAsString("nonce"))) {
            throw new UnauthorizedException("OIDC-Nonce stimmt nicht überein.");
        }
        String subject = idToken.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new UnauthorizedException("ID-Token ohne 'sub'.");
        }
        return new OidcIdentity(
                subject,
                idToken.getClaimAsString("email"),
                idToken.getClaimAsString("preferred_username"),
                idToken.getClaimAsString("name"),
                groups(idToken));
    }

    private Map<String, Object> postForm(String endpoint, MultiValueMap<String, String> form) {
        return rest.post().uri(endpoint)
                .header(HttpHeaders.AUTHORIZATION, basicAuth())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(form)
                .retrieve()
                .body(JSON_MAP);
    }

    /**
     * Holt eine JSON-Ressource typisiert. Die Content-Type-Toleranz (Nextcloud deklariert JSON als
     * {@code text/html}) und der klare Fehler bei einer HTML-Seite stecken im
     * {@link MislabeledJsonConverter} — die Aufrufer bleiben schlicht.
     */
    private Map<String, Object> getJson(String url) {
        return rest.get().uri(url)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(JSON_MAP);
    }

    /** Tiefste Ursachen-Meldung — der {@link RestClient} verpackt Konverter-Fehler mehrfach, die
     * handlungsleitende Meldung (z. B. „… war HTML statt JSON") steht ganz unten. */
    private static String rootMessage(Throwable t) {
        Throwable cause = t;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause.getMessage();
    }

    private String basicAuth() {
        String creds = props.getClientId() + ":" + props.getClientSecret();
        return "Basic " + Base64.getEncoder().encodeToString(creds.getBytes(StandardCharsets.UTF_8));
    }

    /** Gruppen-Claim robust lesen: Liste oder einzelner String werden beide akzeptiert. */
    private List<String> groups(Jwt idToken) {
        Object raw = idToken.getClaims().get(props.getGroupsClaim());
        if (raw instanceof List<?> list) {
            return list.stream().filter(java.util.Objects::nonNull).map(Object::toString).collect(Collectors.toList());
        }
        if (raw instanceof String s && !s.isBlank()) {
            return List.of(s);
        }
        return List.of();
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String s256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    /**
     * JSON-Konverter, der die beiden Nextcloud-Eigenheiten kapselt, damit die Aufrufer typisiert
     * per {@code .body(JSON_MAP)} lesen können:
     * <ul>
     *   <li>Er liest JSON unabhängig vom {@code Content-Type} (Nextcloud deklariert valides JSON als
     *       {@code text/html} — entgegen RFC 8414 §3.2 / RFC 6749 §5.1).</li>
     *   <li>Bekommt er statt JSON eine HTML-Seite (Login-/Startseite), wirft er einen klaren,
     *       handlungsleitenden Fehler statt einer rohen Parser-Meldung.</li>
     * </ul>
     */
    private static final class MislabeledJsonConverter extends JacksonJsonHttpMessageConverter {

        MislabeledJsonConverter() {
            setSupportedMediaTypes(List.of(
                    MediaType.APPLICATION_JSON,
                    MediaType.valueOf("application/*+json"),
                    MediaType.ALL));
        }

        @Override
        public Object read(ResolvableType type, HttpInputMessage message, Map<String, Object> hints)
                throws IOException, HttpMessageNotReadableException {
            byte[] body = message.getBody().readAllBytes();
            if (looksLikeHtml(body)) {
                throw new HttpMessageNotReadableException(
                        "Antwort war HTML statt JSON – unter dieser URL antwortet kein"
                                + " OpenID-Configuration-Dokument. Issuer/Discovery-URL des IdP prüfen.",
                        message);
            }
            return super.read(type, new BufferedHttpInputMessage(body, message.getHeaders()), hints);
        }

        /** Ein mit {@code <} beginnender Body (HTML-/XML-Seite) ist nie JSON. */
        private static boolean looksLikeHtml(byte[] body) {
            for (byte b : body) {
                if (Character.isWhitespace(b)) {
                    continue;
                }
                return b == '<';
            }
            return false;
        }
    }

    /** Gepufferte {@link HttpInputMessage}, damit der Body nach dem HTML-Check erneut (durch Jackson)
     * gelesen werden kann. */
    private record BufferedHttpInputMessage(byte[] body, HttpHeaders headers) implements HttpInputMessage {

        @Override
        public InputStream getBody() {
            return new ByteArrayInputStream(body);
        }

        @Override
        public HttpHeaders getHeaders() {
            return headers;
        }
    }
}
