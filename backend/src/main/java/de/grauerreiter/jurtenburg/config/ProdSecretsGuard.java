package de.grauerreiter.jurtenburg.config;

import de.grauerreiter.jurtenburg.security.JwtProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Verhindert, dass die Anwendung in Produktion mit den unsicheren Dev-Defaults
 * startet. Nur aktiv unter dem {@code prod}-Profil; lokal/CI bleiben die bequemen
 * Defaults erhalten. Der Konstruktor läuft beim Context-Start — schlägt er fehl,
 * bootet die App gar nicht erst (fail-fast statt stillschweigend unsicher).
 */
@Configuration
@Profile("prod")
public class ProdSecretsGuard {

    // MÜSSEN mit den Defaults in application.yml übereinstimmen.
    static final String DEV_JWT_SECRET = "dev-only-insecure-secret-change-me-please-32bytes";
    static final String DEV_ADMIN_PASSWORD = "admin12345";

    public ProdSecretsGuard(JwtProperties jwt, @Value("${app.admin.password:}") String adminPassword) {
        if (isMissingOrDefault(jwt.getSecret(), DEV_JWT_SECRET)) {
            throw new IllegalStateException(
                    "In Produktion muss JWT_SECRET gesetzt sein (>= 32 Bytes, nicht der Dev-Default).");
        }
        if (isMissingOrDefault(adminPassword, DEV_ADMIN_PASSWORD)) {
            throw new IllegalStateException(
                    "In Produktion muss APP_ADMIN_PASSWORD gesetzt sein (nicht der Dev-Default).");
        }
    }

    private static boolean isMissingOrDefault(String value, String devDefault) {
        return value == null || value.isBlank() || value.equals(devDefault);
    }
}
