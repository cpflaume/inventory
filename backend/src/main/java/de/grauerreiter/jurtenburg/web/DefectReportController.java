package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.DefectReport;
import de.grauerreiter.jurtenburg.repo.DefectReportRepository;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.service.ItemService;
import de.grauerreiter.jurtenburg.service.LocationService;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.DefectReportRequest;
import de.grauerreiter.jurtenburg.web.Dtos.DefectReportResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Mängelmeldungen — Kernflow ist die schnelle Erfassung am Lagerplatz per Handy.
 */
@RestController
@RequestMapping("/api/depots/{depotId}/defect-reports")
public class DefectReportController {

    private final DefectReportRepository reports;
    private final DepotRepository depots;
    private final ItemService itemService;
    private final LocationService locationService;

    public DefectReportController(DefectReportRepository reports, DepotRepository depots,
            ItemService itemService, LocationService locationService) {
        this.reports = reports;
        this.depots = depots;
        this.itemService = itemService;
        this.locationService = locationService;
    }

    @GetMapping
    public List<DefectReportResponse> list(@PathVariable UUID depotId) {
        return reports.findByDepotIdOrderByCreatedAtDesc(depotId).stream()
                .map(DefectReportResponse::of).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DefectReportResponse create(@PathVariable UUID depotId, @Valid @RequestBody DefectReportRequest req) {
        if (!depots.existsById(depotId)) {
            throw new NotFoundException("Lager nicht gefunden: " + depotId);
        }
        // Referenzierte Entities müssen zum selben Lager gehören (Mandantentrennung).
        if (req.itemId() != null) {
            itemService.getInDepot(depotId, req.itemId());
        }
        if (req.locationId() != null) {
            locationService.getInDepot(depotId, req.locationId());
        }
        DefectReport report = new DefectReport(depotId, req.title(), req.severity());
        report.setItemId(req.itemId());
        report.setLocationId(req.locationId());
        report.setDescription(req.description());
        report.setReporter(req.reporter());
        DefectReportResponse saved = DefectReportResponse.of(reports.save(report));
        // Ein Mangel am konkreten Teil zieht dessen Zustands-Ampel nach.
        if (req.itemId() != null) {
            itemService.escalateForDefect(depotId, req.itemId(), req.severity());
        }
        return saved;
    }

    /** Mangel als behoben markieren. */
    @PostMapping("/{reportId}/resolve")
    public DefectReportResponse resolve(@PathVariable UUID depotId, @PathVariable UUID reportId) {
        DefectReport report = load(depotId, reportId);
        report.resolve();
        return DefectReportResponse.of(reports.save(report));
    }

    private DefectReport load(UUID depotId, UUID reportId) {
        DefectReport report = reports.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Mängelmeldung nicht gefunden: " + reportId));
        if (!report.getDepotId().equals(depotId)) {
            throw new NotFoundException("Mängelmeldung gehört nicht zu diesem Lager: " + reportId);
        }
        return report;
    }
}
