package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.repo.AppUserRepository;
import de.grauerreiter.jurtenburg.security.JwtService;
import de.grauerreiter.jurtenburg.web.ApiExceptions.ConflictException;
import de.grauerreiter.jurtenburg.web.ApiExceptions.UnauthorizedException;
import de.grauerreiter.jurtenburg.web.AuthDtos.RegisterRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lokaler Auth-Provider: Registrierung (→ PENDING) und Login (nur ACTIVE).
 * Andere Provider (OIDC) nutzen {@link UserProvisioningService} + {@link JwtService},
 * münden aber im selben App-JWT.
 */
@Service
public class AuthService {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AppUserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Registrierung eines lokalen Benutzers. Die E-Mail-Adresse ist zugleich der Benutzername
     * (Login-Identität); der frei wählbare Anzeigename bleibt davon getrennt. Startet als PENDING
     * (Admin muss freigeben).
     */
    @Transactional
    public AppUser register(RegisterRequest req) {
        String email = req.email().trim();
        if (users.existsByUsername(email)) {
            throw new ConflictException("E-Mail-Adresse ist bereits vergeben: " + email);
        }
        AppUser user = new AppUser(email, AuthProvider.LOCAL);
        user.setEmail(email);
        user.setDisplayName(req.displayName() == null || req.displayName().isBlank()
                ? defaultDisplayName(email) : req.displayName());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        // status = PENDING, systemRole = USER (Defaults)
        return users.save(user);
    }

    /** Ohne freien Anzeigenamen der lokale Teil der E-Mail (vor dem {@code @}). */
    private static String defaultDisplayName(String email) {
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    /** Login per E-Mail. Prüft Passwort und Freischaltung; liefert ein App-JWT. */
    @Transactional(readOnly = true)
    public String login(String email, String password) {
        AppUser user = users.findByUsername(email == null ? null : email.trim())
                .filter(u -> u.getProvider() == AuthProvider.LOCAL)
                .orElseThrow(() -> new UnauthorizedException("Ungültige Anmeldedaten."));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Ungültige Anmeldedaten.");
        }
        if (!user.isActive()) {
            // Bewusst 401 statt 403, ohne Detail-Leak, aber mit Hinweis auf Freischaltung.
            throw new UnauthorizedException(
                    "Konto noch nicht freigeschaltet oder gesperrt. Bitte auf Admin-Freigabe warten.");
        }
        return jwtService.generate(user);
    }

    @Transactional(readOnly = true)
    public AppUser byId(java.util.UUID id) {
        return users.findById(id)
                .orElseThrow(() -> new UnauthorizedException("Benutzer nicht gefunden."));
    }
}
