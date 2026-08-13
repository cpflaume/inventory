package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.DefectReport;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DefectReportRepository extends JpaRepository<DefectReport, UUID> {

    List<DefectReport> findByDepotIdOrderByCreatedAtDesc(UUID depotId);
}
