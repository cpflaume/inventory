package de.grauerreiter.jurtenburg;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Basis für Integrationstests. Zwei Betriebsarten:
 *
 * <ul>
 *   <li><b>Lokal</b> (kein {@code SPRING_DATASOURCE_URL} gesetzt): startet eine echte
 *       Postgres via Testcontainers — Zero-Setup, braucht nur Docker.</li>
 *   <li><b>CI</b> ({@code SPRING_DATASOURCE_URL} gesetzt, z.B. aus einem GitHub-Actions
 *       Service-Container): verbindet direkt gegen diese DB, ohne Testcontainers — robust
 *       auch auf Runnern, deren Docker-Netzwerk das Port-Mapping von Testcontainers nicht
 *       durchreicht.</li>
 * </ul>
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
        if (POSTGRES != null) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
        }
        // Sonst: SPRING_DATASOURCE_URL/USERNAME/PASSWORD kommen aus der Umgebung.
    }
}
