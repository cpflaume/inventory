package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.DepotRole;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.security.AccessService;
import de.grauerreiter.jurtenburg.security.AppUserDetails;
import de.grauerreiter.jurtenburg.security.JwtService;
import de.grauerreiter.jurtenburg.service.AuthService;
import de.grauerreiter.jurtenburg.web.AuthDtos.AuthResponse;
import de.grauerreiter.jurtenburg.web.AuthDtos.DepotAccess;
import de.grauerreiter.jurtenburg.web.AuthDtos.LoginRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.MeResponse;
import de.grauerreiter.jurtenburg.web.AuthDtos.RegisterRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.UserSummary;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final AccessService accessService;
    private final DepotRepository depots;

    public AuthController(AuthService authService, JwtService jwtService, AccessService accessService,
            DepotRepository depots) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.accessService = accessService;
        this.depots = depots;
    }

    /** Registrierung (lokal). Konto ist danach PENDING und muss freigegeben werden. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary register(@Valid @RequestBody RegisterRequest req) {
        return UserSummary.of(authService.register(req));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        String token = authService.login(req.email(), req.password());
        AppUser user = authService.byId(jwtService.userId(jwtService.parse(token)));
        return new AuthResponse(token, UserSummary.of(user));
    }

    /** Aktueller Benutzer inkl. der Lager, die er erreichen darf (mit Rolle). */
    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AppUserDetails principal) {
        AppUser user = authService.byId(principal.getUserId());
        List<DepotAccess> depotAccesses = depots.findAllById(accessService.accessibleDepotIds(principal)).stream()
                .map(d -> new DepotAccess(d.getId(), d.getName(),
                        accessService.effectiveRole(principal, d.getId()).orElse(DepotRole.VIEWER)))
                .sorted(java.util.Comparator.comparing(DepotAccess::depotName))
                .toList();
        return new MeResponse(UserSummary.of(user), depotAccesses);
    }
}
