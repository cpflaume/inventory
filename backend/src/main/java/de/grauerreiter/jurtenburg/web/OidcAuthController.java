package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.security.OidcLoginConfigurer;
import de.grauerreiter.jurtenburg.security.OidcProperties;
import de.grauerreiter.jurtenburg.security.OidcClientRegistrationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Öffentlicher OIDC-Statusendpunkt fürs Frontend. Der eigentliche Login-Flow (Weiterleitung zum
 * IdP, Callback, Token-Austausch, ID-Token-Verifikation) läuft komplett über die
 * Spring-Security-OAuth2-Client-Bibliothek (siehe {@code OidcLoginConfigurer}); dieser Controller
 * verrät dem Frontend nur, ob OIDC aktiv ist und unter welcher URL der Login startet.
 */
@RestController
@RequestMapping("/api/auth/oidc")
public class OidcAuthController {

    /** Start-URL des Logins: Basis + Registrierungs-ID (die Bibliothek erwartet {@code …/oidc}). */
    private static final String LOGIN_URL =
            OidcLoginConfigurer.AUTHORIZATION_BASE_URI + "/" + OidcClientRegistrationRepository.REGISTRATION_ID;

    private final OidcProperties props;

    public OidcAuthController(OidcProperties props) {
        this.props = props;
    }

    /** Öffentlich: sagt dem Frontend, ob der „Mit Nextcloud anmelden"-Button erscheinen soll. */
    @GetMapping("/config")
    public OidcConfig config() {
        return new OidcConfig(props.isEnabled(), LOGIN_URL);
    }

    /** Öffentliche OIDC-Statusinfo fürs Frontend. */
    public record OidcConfig(boolean enabled, String loginUrl) {
    }
}
