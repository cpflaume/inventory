package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.ConditionFlag;
import de.grauerreiter.jurtenburg.domain.DefectReport;
import de.grauerreiter.jurtenburg.domain.DefectStatus;
import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.Item;
import de.grauerreiter.jurtenburg.domain.Kit;
import de.grauerreiter.jurtenburg.domain.KitPosition;
import de.grauerreiter.jurtenburg.domain.Location;
import de.grauerreiter.jurtenburg.domain.LocationType;
import de.grauerreiter.jurtenburg.domain.Severity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Request- und Response-DTOs. Bewusst als schlanke Records gehalten;
 * Mapping-Helfer bilden Entities darauf ab.
 */
public final class Dtos {

    private Dtos() {
    }

    // ---- Depot ----

    public record DepotRequest(@NotBlank String name, String description) {
    }

    public record DepotResponse(UUID id, String name, String description, Instant createdAt) {
        public static DepotResponse of(Depot d) {
            return new DepotResponse(d.getId(), d.getName(), d.getDescription(), d.getCreatedAt());
        }
    }

    // ---- Item ----

    public record ItemRequest(
            @NotBlank String name,
            String category,
            @PositiveOrZero int quantity,
            UUID parentItemId,
            UUID locationId,
            Integer row,
            Integer col,
            ConditionFlag conditionFlag,
            String note) {
    }

    public record ItemResponse(
            UUID id,
            String name,
            String category,
            int quantity,
            UUID parentItemId,
            UUID locationId,
            Integer row,
            Integer col,
            ConditionFlag conditionFlag,
            String note) {
        public static ItemResponse of(Item i) {
            return new ItemResponse(i.getId(), i.getName(), i.getCategory(), i.getQuantity(),
                    i.getParentItemId(), i.getLocationId(), i.getRow(), i.getCol(),
                    i.getConditionFlag(), i.getNote());
        }
    }

    // ---- Location ----

    public record LocationRequest(
            @NotNull LocationType type,
            @NotBlank String label,
            Integer gridRows,
            Integer gridCols,
            UUID parentLocationId,
            Integer row,
            Integer col) {
    }

    public record LocationResponse(
            UUID id,
            LocationType type,
            String label,
            Integer gridRows,
            Integer gridCols,
            UUID parentLocationId,
            Integer row,
            Integer col) {
        public static LocationResponse of(Location l) {
            return new LocationResponse(l.getId(), l.getType(), l.getLabel(), l.getGridRows(),
                    l.getGridCols(), l.getParentLocationId(), l.getRow(), l.getCol());
        }
    }

    // ---- Kit / Stückliste ----

    public record KitPositionRequest(@NotBlank String label, @PositiveOrZero int targetQuantity, UUID itemId) {
    }

    public record KitRequest(@NotBlank String name, String description, List<KitPositionRequest> positions) {
    }

    public record KitPositionResponse(UUID id, String label, int targetQuantity, UUID itemId) {
        public static KitPositionResponse of(KitPosition p) {
            return new KitPositionResponse(p.getId(), p.getLabel(), p.getTargetQuantity(), p.getItemId());
        }
    }

    public record KitResponse(UUID id, String name, String description, List<KitPositionResponse> positions) {
        public static KitResponse of(Kit k) {
            return new KitResponse(k.getId(), k.getName(), k.getDescription(),
                    k.getPositions().stream().map(KitPositionResponse::of).toList());
        }
    }

    // ---- Mängelmeldung ----

    public record DefectReportRequest(
            UUID itemId,
            UUID locationId,
            @NotBlank String title,
            String description,
            @NotNull Severity severity,
            String reporter) {
    }

    public record DefectReportResponse(
            UUID id,
            UUID itemId,
            UUID locationId,
            String title,
            String description,
            Severity severity,
            DefectStatus status,
            String reporter,
            Instant createdAt,
            Instant resolvedAt) {
        public static DefectReportResponse of(DefectReport d) {
            return new DefectReportResponse(d.getId(), d.getItemId(), d.getLocationId(), d.getTitle(),
                    d.getDescription(), d.getSeverity(), d.getStatus(), d.getReporter(),
                    d.getCreatedAt(), d.getResolvedAt());
        }
    }
}
