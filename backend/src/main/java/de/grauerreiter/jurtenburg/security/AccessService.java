package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.DepotRole;
import de.grauerreiter.jurtenburg.domain.GroupDepotAccess;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.repo.GroupDepotAccessRepository;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * Autorisierung auf Lager-Ebene. Der Zugriff eines Benutzers ergibt sich aus den
 * {@link GroupDepotAccess}-Mappings seiner Gruppen (höchste Rolle gewinnt).
 * Ein Plattform-Admin sieht/darf alles.
 */
@Service
public class AccessService {

    private final GroupDepotAccessRepository accesses;
    private final DepotRepository depots;

    public AccessService(GroupDepotAccessRepository accesses, DepotRepository depots) {
        this.accesses = accesses;
        this.depots = depots;
    }

    /** Effektive Rolle des Benutzers im Lager (höchste über alle Gruppen), sonst leer. */
    public Optional<DepotRole> effectiveRole(AppUserDetails user, UUID depotId) {
        if (user == null) {
            return Optional.empty();
        }
        if (user.isPlatformAdmin()) {
            return Optional.of(DepotRole.ADMIN);
        }
        if (user.getGroupIds().isEmpty()) {
            return Optional.empty();
        }
        return accesses.findByGroupIdIn(user.getGroupIds()).stream()
                .filter(a -> a.getDepotId().equals(depotId))
                .map(GroupDepotAccess::getRole)
                .max(java.util.Comparator.comparingInt(Enum::ordinal));
    }

    public boolean canAccess(AppUserDetails user, UUID depotId, DepotRole min) {
        return effectiveRole(user, depotId).map(r -> r.covers(min)).orElse(false);
    }

    /** Wirft 403, wenn der Benutzer das Lager nicht mit mindestens {@code min} erreichen darf. */
    public void requireAccess(AppUserDetails user, UUID depotId, DepotRole min) {
        if (!canAccess(user, depotId, min)) {
            throw new AccessDeniedException(
                    "Kein Zugriff auf dieses Lager (mindestens " + min + " erforderlich).");
        }
    }

    /** Alle Lager-IDs, die der Benutzer erreichen darf (Admin: alle). */
    public Set<UUID> accessibleDepotIds(AppUserDetails user) {
        if (user == null) {
            return Set.of();
        }
        if (user.isPlatformAdmin()) {
            return depots.findAll().stream().map(Depot::getId).collect(Collectors.toSet());
        }
        if (user.getGroupIds().isEmpty()) {
            return Set.of();
        }
        return accesses.findByGroupIdIn(user.getGroupIds()).stream()
                .map(GroupDepotAccess::getDepotId)
                .collect(Collectors.toSet());
    }
}
