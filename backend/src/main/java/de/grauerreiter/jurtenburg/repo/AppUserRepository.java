package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.AppUser;
import de.grauerreiter.jurtenburg.domain.AuthProvider;
import de.grauerreiter.jurtenburg.domain.SystemRole;
import de.grauerreiter.jurtenburg.domain.UserStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<AppUser> findByProviderAndExternalId(AuthProvider provider, String externalId);

    boolean existsBySystemRole(SystemRole systemRole);

    /** Gibt es einen weiteren aktiven Admin außer {@code id}? (Schutz vor Aussperren des letzten Admins.) */
    boolean existsBySystemRoleAndStatusAndIdNot(SystemRole systemRole, UserStatus status, UUID id);

    List<AppUser> findAllByOrderByCreatedAtDesc();
}
