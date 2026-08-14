package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.UserGroup;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGroupRepository extends JpaRepository<UserGroup, UUID> {

    Optional<UserGroup> findByName(String name);

    boolean existsByName(String name);

    java.util.List<UserGroup> findAllByOrderByNameAsc();
}
