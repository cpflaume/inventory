package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.Location;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, UUID> {

    List<Location> findByDepotIdOrderByLabelAsc(UUID depotId);

    List<Location> findByParentLocationId(UUID parentLocationId);

    List<Location> findByParentLocationIdAndRowAndCol(UUID parentLocationId, Integer row, Integer col);
}
