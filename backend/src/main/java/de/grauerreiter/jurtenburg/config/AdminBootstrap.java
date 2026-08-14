package de.grauerreiter.jurtenburg.config;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.domain.SystemRole;
import de.grauerreiter.jurtenburg.repo.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Legt beim Start einen Bootstrap-Admin an, falls noch gar kein Admin existiert —
 * damit überhaupt jemand Benutzer freigeben und Gruppen/Lager verwalten kann.
 * In Produktion Zugangsdaten über APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD setzen.
 */
@Configuration
public class AdminBootstrap {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    @Bean
    CommandLineRunner ensureAdmin(AppUserRepository users, PasswordEncoder encoder,
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.password}") String password) {
        return args -> {
            if (users.existsBySystemRole(SystemRole.ADMIN)) {
                return;
            }
            AppUser admin = new AppUser(username, AuthProvider.LOCAL);
            admin.setEmail(username);
            admin.setDisplayName("Administrator");
            admin.setPasswordHash(encoder.encode(password));
            admin.setSystemRole(SystemRole.ADMIN);
            admin.approve(); // sofort aktiv
            users.save(admin);
            log.info("Bootstrap-Admin '{}' angelegt.", username);
        };
    }
}
