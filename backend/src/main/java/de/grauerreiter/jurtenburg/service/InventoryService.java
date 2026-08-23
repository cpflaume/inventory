package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.DefectReport;
import de.grauerreiter.jurtenburg.domain.DefectStatus;
import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.Item;
import de.grauerreiter.jurtenburg.domain.Location;
import de.grauerreiter.jurtenburg.repo.DefectReportRepository;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.repo.ItemRepository;
import de.grauerreiter.jurtenburg.repo.LocationRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.ItemResponse;
import de.grauerreiter.jurtenburg.web.Views.DefectSummary;
import de.grauerreiter.jurtenburg.web.Views.InventoryGroup;
import de.grauerreiter.jurtenburg.web.Views.InventoryView;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Druckbare Bestandsliste: alle Items eines Lagers, nach Aufräumort gruppiert.
 */
@Service
public class InventoryService {

    private final DepotRepository depots;
    private final ItemRepository items;
    private final LocationRepository locations;
    private final DefectReportRepository defects;

    public InventoryService(DepotRepository depots, ItemRepository items, LocationRepository locations,
            DefectReportRepository defects) {
        this.depots = depots;
        this.items = items;
        this.locations = locations;
        this.defects = defects;
    }

    @Transactional(readOnly = true)
    public InventoryView inventory(UUID depotId) {
        Depot depot = depots.findById(depotId)
                .orElseThrow(() -> new NotFoundException("Lager nicht gefunden: " + depotId));

        Map<UUID, String> labels = new LinkedHashMap<>();
        for (Location loc : locations.findByDepotIdOrderByLabelAsc(depotId)) {
            labels.put(loc.getId(), loc.getLabel());
        }

        // Nach locationId gruppieren (nicht nach Label) — gleichnamige Orte bleiben getrennt.
        Map<UUID, List<ItemResponse>> byLocation = new LinkedHashMap<>();
        Map<UUID, UUID> itemLocation = new HashMap<>();
        List<ItemResponse> unassigned = new ArrayList<>();
        int total = 0;
        for (Item item : items.findByDepotIdOrderByNameAsc(depotId)) {
            itemLocation.put(item.getId(), item.getLocationId());
            if (item.getLocationId() == null) {
                unassigned.add(ItemResponse.of(item));
            } else {
                byLocation.computeIfAbsent(item.getLocationId(), k -> new ArrayList<>())
                        .add(ItemResponse.of(item));
            }
            total++;
        }

        // Offene Mängel je Gruppe: bevorzugt am Ort des betroffenen Teils, sonst am gemeldeten Ort.
        Map<UUID, List<DefectSummary>> defectsByLocation = new LinkedHashMap<>();
        List<DefectSummary> unassignedDefects = new ArrayList<>();
        for (DefectReport d : defects.findByDepotIdOrderByCreatedAtDesc(depotId)) {
            if (d.getStatus() != DefectStatus.OPEN) {
                continue;
            }
            UUID groupLoc = null;
            if (d.getItemId() != null && itemLocation.containsKey(d.getItemId())) {
                groupLoc = itemLocation.get(d.getItemId());
            }
            if (groupLoc == null && d.getLocationId() != null && labels.containsKey(d.getLocationId())) {
                groupLoc = d.getLocationId();
            }
            if (groupLoc == null) {
                unassignedDefects.add(DefectSummary.of(d));
            } else {
                defectsByLocation.computeIfAbsent(groupLoc, k -> new ArrayList<>()).add(DefectSummary.of(d));
            }
        }

        List<InventoryGroup> groups = new ArrayList<>();
        // In Ort-Reihenfolge (nach Label sortiert) ausgeben — Orte mit Items ODER offenen Mängeln.
        labels.forEach((locationId, label) -> {
            List<ItemResponse> list = byLocation.get(locationId);
            List<DefectSummary> ds = defectsByLocation.getOrDefault(locationId, List.of());
            if (list != null || !ds.isEmpty()) {
                groups.add(new InventoryGroup(locationId, label, list != null ? list : List.of(), ds));
            }
        });
        if (!unassigned.isEmpty() || !unassignedDefects.isEmpty()) {
            groups.add(new InventoryGroup(null, "Nicht einsortiert", unassigned, unassignedDefects));
        }
        return new InventoryView(depot.getName(), groups, total);
    }
}
