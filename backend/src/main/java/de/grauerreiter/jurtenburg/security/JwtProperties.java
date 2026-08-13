package de.grauerreiter.jurtenburg.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT-Konfiguration. {@code secret} muss ≥ 32 Bytes sein (HS256).
 */
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String secret = "";
    private long expirationMs = 86_400_000L; // 24h
    private String issuer = "jurtenburg";

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }
}
