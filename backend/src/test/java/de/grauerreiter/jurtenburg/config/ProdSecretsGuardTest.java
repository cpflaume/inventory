package de.grauerreiter.jurtenburg.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import de.grauerreiter.jurtenburg.security.JwtProperties;
import org.junit.jupiter.api.Test;

/** Der Prod-Guard muss die unsicheren Dev-Defaults ablehnen. */
class ProdSecretsGuardTest {

    private JwtProperties jwt(String secret) {
        JwtProperties p = new JwtProperties();
        p.setSecret(secret);
        return p;
    }

    @Test
    void rejectsDefaultJwtSecret() {
        assertThrows(IllegalStateException.class,
                () -> new ProdSecretsGuard(jwt(ProdSecretsGuard.DEV_JWT_SECRET), "starkes-passwort"));
    }

    @Test
    void rejectsBlankJwtSecret() {
        assertThrows(IllegalStateException.class,
                () -> new ProdSecretsGuard(jwt(""), "starkes-passwort"));
    }

    @Test
    void rejectsDefaultAdminPassword() {
        assertThrows(IllegalStateException.class,
                () -> new ProdSecretsGuard(jwt("ein-echtes-langes-geheimnis-0123456789ab"),
                        ProdSecretsGuard.DEV_ADMIN_PASSWORD));
    }

    @Test
    void acceptsStrongValues() {
        assertDoesNotThrow(
                () -> new ProdSecretsGuard(jwt("ein-echtes-langes-geheimnis-0123456789ab"), "S3hr-Geheim!"));
    }
}
