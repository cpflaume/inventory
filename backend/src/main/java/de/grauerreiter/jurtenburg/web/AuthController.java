package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.DepotRole;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.security.AccessService;
import de.grauerreiter.jurtenburg.security.AppUserDetails;
import de.grauerreiter.jurtenburg.security.JwtService;
import de.grauerreiter.jurtenburg.service.AuditService;
import de.grauerreiter.jurtenburg.service.AuthService;
import de.grauerreiter.jurtenburg.web.AuthDtos.AuthResponse;
import de.grauerreiter.jurtenburg.web.AuthDtos.DepotAccess;
import de.grauerreiter.jurtenburg.web.AuthDtos.LoginRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.MeResponse;
import de.grauerreiter.jurtenburg.web.AuthDtos.RegisterRequest;
import de.grauerreiter.jurtenburg.web.AuthDtos.UserSummary;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AuditService audit;

    public AuthController(AuthService authService, JwtService jwtService, AccessService accessService,
            DepotRepository depots, AuditService audit) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.accessService = accessService;
        this.depots = depots;
        this.audit = audit;
    }

    /** Registrierung (lokal). Konto ist danach PENDING und muss freigegeben werden. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary register(@Valid @RequestBody RegisterRequest req) {
        return UserSummary.of(authService.register(req));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        String ip = AuditService.clientIp(request);
        try {
            String token = authService.login(req.email(), req.password());
            AppUser user = authService.byId(jwtService.userId(jwtService.parse(token)));
            audit.recordLogin(user.getUsername(), user.getId(), true, ip);
            return new AuthResponse(token, UserSummary.of(user));
        } catch (RuntimeException ex) {
            audit.recordLogin(req.email(), null, false, ip);
            throw ex;
        }
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
