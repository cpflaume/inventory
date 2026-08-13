package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.Item;
import de.grauerreiter.jurtenburg.domain.Location;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.repo.ItemRepository;
import de.grauerreiter.jurtenburg.repo.LocationRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.ItemResponse;
import de.grauerreiter.jurtenburg.web.Views.InventoryGroup;
import de.grauerreiter.jurtenburg.web.Views.InventoryView;
import java.util.ArrayList;
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

    public InventoryService(DepotRepository depots, ItemRepository items, LocationRepository locations) {
        this.depots = depots;
        this.items = items;
        this.locations = locations;
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
        List<ItemResponse> unassigned = new ArrayList<>();
        int total = 0;
        for (Item item : items.findByDepotIdOrderByNameAsc(depotId)) {
            if (item.getLocationId() == null) {
                unassigned.add(ItemResponse.of(item));
            } else {
                byLocation.computeIfAbsent(item.getLocationId(), k -> new ArrayList<>())
                        .add(ItemResponse.of(item));
            }
            total++;
        }

        List<InventoryGroup> groups = new ArrayList<>();
        // In Ort-Reihenfolge (nach Label sortiert) ausgeben, nur Orte mit Items.
        labels.forEach((locationId, label) -> {
            List<ItemResponse> list = byLocation.get(locationId);
            if (list != null) {
                groups.add(new InventoryGroup(locationId, label, list));
            }
        });
        if (!unassigned.isEmpty()) {
            groups.add(new InventoryGroup(null, "Nicht einsortiert", unassigned));
        }
        return new InventoryView(depot.getName(), groups, total);
    }
}
