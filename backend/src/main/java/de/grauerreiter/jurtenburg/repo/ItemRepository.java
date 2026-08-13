package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.Item;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, UUID> {

    List<Item> findByDepotIdOrderByNameAsc(UUID depotId);

    List<Item> findByLocationId(UUID locationId);

    List<Item> findByLocationIdAndRowAndCol(UUID locationId, Integer row, Integer col);
}
