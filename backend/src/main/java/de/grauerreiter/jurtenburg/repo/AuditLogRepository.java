package de.grauerreiter.jurtenburg.repo;

import de.grauerreiter.jurtenburg.domain.AuditLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Audit-Einträge. {@link JpaSpecificationExecutor} liefert die dynamisch gefilterte,
 * seitenweise Suche für die Admin-Audit-View.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {
}
