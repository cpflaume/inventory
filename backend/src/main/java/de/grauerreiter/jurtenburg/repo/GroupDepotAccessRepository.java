package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.GroupDepotAccess;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupDepotAccessRepository extends JpaRepository<GroupDepotAccess, UUID> {

    List<GroupDepotAccess> findByGroupIdIn(Collection<UUID> groupIds);

    List<GroupDepotAccess> findByGroupId(UUID groupId);

    List<GroupDepotAccess> findByDepotId(UUID depotId);

    Optional<GroupDepotAccess> findByGroupIdAndDepotId(UUID groupId, UUID depotId);
}
