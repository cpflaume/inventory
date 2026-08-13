package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.Depot;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepotRepository extends JpaRepository<Depot, UUID> {
}
