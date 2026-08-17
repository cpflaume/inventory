package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.web.ApiExceptions.UnauthorizedException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    private final OidcProperties props;
    private final RestClient rest;
    private final SecureRandom random = new SecureRandom();

    private volatile Metadata metadata;

    public OidcService(OidcProperties props) {
        this.props = props;
        this.rest = RestClient.builder().build();
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

    @SuppressWarnings("unchecked")
    private Metadata discover() {
        String url = props.getIssuerUri() + "/.well-known/openid-configuration";
        Map<String, Object> doc;
        try {
            doc = rest.get().uri(url).retrieve().body(Map.class);
        } catch (Exception ex) {
            throw new IllegalStateException("OIDC-Discovery fehlgeschlagen (" + url + "): " + ex.getMessage(), ex);
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
            throw new UnauthorizedException("OIDC-Token-Austausch fehlgeschlagen: " + ex.getMessage());
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> postForm(String endpoint, MultiValueMap<String, String> form) {
        return rest.post().uri(endpoint)
                .header(HttpHeaders.AUTHORIZATION, basicAuth())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(form)
                .retrieve()
                .body(Map.class);
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
}
