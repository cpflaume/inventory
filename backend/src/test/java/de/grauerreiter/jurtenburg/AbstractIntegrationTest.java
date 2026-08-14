package de.grauerreiter.jurtenburg;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.domain.SystemRole;
import de.grauerreiter.jurtenburg.security.AppUserDetails;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Basis für Integrationstests. Postgres via Testcontainers (lokal) oder externer
 * Service-Container (CI, wenn SPRING_DATASOURCE_URL gesetzt).
 *
 * <p>Da alle Endpoints jetzt authentifiziert sind, liefert {@link #adminMockMvc} eine
 * MockMvc-Instanz, die jede Anfrage als Plattform-Admin ausführt (umgeht damit die
 * Lager-Zugriffsprüfungen). Ein Test der Auth-/Rechte-Logik selbst nutzt stattdessen
 * echte Tokens.</p>
 */
@SpringBootTest
public abstract class AbstractIntegrationTest {

    private static final PostgreSQLContainer<?> POSTGRES;

    static {
        if (System.getenv("SPRING_DATASOURCE_URL") == null) {
            POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");
            POSTGRES.start();
        } else {
            POSTGRES = null;
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.seed-demo", () -> "false");
        // Deterministischer, ausreichend langer Test-Secret.
        registry.add("app.jwt.secret", () -> "test-secret-please-change-0123456789abcdef");
        if (POSTGRES != null) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
        }
    }

    /** Synthetischer Plattform-Admin-Principal (umgeht Lager-Zugriffsprüfungen). */
    protected static AppUserDetails adminPrincipal() {
        AppUser admin = new AppUser("test-admin", AuthProvider.LOCAL);
        admin.setSystemRole(SystemRole.ADMIN);
        return new AppUserDetails(admin);
    }

    /** MockMvc mit Security-Filterkette, jede Anfrage als Plattform-Admin. */
    protected MockMvc adminMockMvc(WebApplicationContext context) {
        AppUserDetails admin = adminPrincipal();
        var auth = new UsernamePasswordAuthenticationToken(admin, null, admin.getAuthorities());
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .defaultRequest(get("/").with(authentication(auth)))
                .build();
    }

    /** MockMvc mit Security-Filterkette, ohne Default-Benutzer (für echte Tokens). */
    protected MockMvc anonymousMockMvc(WebApplicationContext context) {
        return MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }
}
