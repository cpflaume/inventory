package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.domain.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

/**
 * Stellt App-JWTs aus und prüft sie (HS256). Jeder Auth-Provider mündet in ein
 * solches Token — daher ist der Rest der App provider-unabhängig.
 */
@Service
public class JwtService {

    private final JwtProperties props;
    private SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        byte[] bytes = props.getSecret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "JWT-Secret muss mindestens 32 Bytes (256 bit) haben. Setze die Umgebungsvariable JWT_SECRET.");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
    }

    public String generate(AppUser user) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .issuer(props.getIssuer())
                .subject(user.getUsername())
                .claim("userId", user.getId().toString())
                .claim("role", user.getSystemRole().name())
                .issuedAt(new Date(now))
                .expiration(new Date(now + props.getExpirationMs()))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID userId(Claims claims) {
        return UUID.fromString(claims.get("userId", String.class));
    }
}
