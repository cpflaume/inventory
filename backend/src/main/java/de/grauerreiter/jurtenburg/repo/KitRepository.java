package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.Kit;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KitRepository extends JpaRepository<Kit, UUID> {

    List<Kit> findByDepotIdOrderByNameAsc(UUID depotId);
}
