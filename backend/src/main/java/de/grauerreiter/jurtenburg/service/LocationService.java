package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.DefectStatus;
import de.grauerreiter.jurtenburg.domain.Item;
import de.grauerreiter.jurtenburg.domain.Location;
import de.grauerreiter.jurtenburg.domain.LocationType;
import de.grauerreiter.jurtenburg.repo.DefectReportRepository;
import de.grauerreiter.jurtenburg.repo.ItemRepository;
import de.grauerreiter.jurtenburg.repo.LocationRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.BusinessRuleException;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.ItemResponse;
import de.grauerreiter.jurtenburg.web.Dtos.LocationRequest;
import de.grauerreiter.jurtenburg.web.Views.BoxContentsView;
import de.grauerreiter.jurtenburg.web.Views.BoxView;
import de.grauerreiter.jurtenburg.web.Views.CellView;
import de.grauerreiter.jurtenburg.web.Views.DefectSummary;
import de.grauerreiter.jurtenburg.web.Views.ShelfView;
import de.grauerreiter.jurtenburg.web.Views.WarehouseView;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Aufräumorte (Regale/Kisten), Platzierungs-Validierung und die Komposition
 * des virtuellen Lagers.
 */
@Service
public class LocationService {

    private static final int MIN_DIM = 1;
    private static final int MAX_DIM = 8;

    private final LocationRepository locations;
    private final ItemRepository items;
    private final DefectReportRepository defects;

    public LocationService(LocationRepository locations, ItemRepository items, DefectReportRepository defects) {
        this.locations = locations;
        this.items = items;
        this.defects = defects;
    }

    public Location getInDepot(UUID depotId, UUID locationId) {
        Location location = locations.findById(locationId)
                .orElseThrow(() -> new NotFoundException("Ort nicht gefunden: " + locationId));
        if (!location.getDepotId().equals(depotId)) {
            throw new NotFoundException("Ort gehört nicht zu diesem Lager: " + locationId);
        }
        return location;
    }

    @Transactional
    public Location create(UUID depotId, LocationRequest req) {
        Location location = new Location(depotId, req.type(), req.label());
        applyAndValidate(depotId, location, req);
        return locations.save(location);
    }

    @Transactional
    public Location update(UUID depotId, UUID locationId, LocationRequest req) {
        Location location = getInDepot(depotId, locationId);
        if (location.getType() != req.type()) {
            throw new BusinessRuleException("Der Typ eines Orts kann nicht geändert werden.");
        }
        location.setLabel(req.label());
        applyAndValidate(depotId, location, req);
        return locations.save(location);
    }

    @Transactional
    public void delete(UUID depotId, UUID locationId) {
        Location location = getInDepot(depotId, locationId);
        // Items an diesem Ort verlieren ihre Platzierung, statt hart zu blockieren.
        for (Item item : items.findByLocationId(locationId)) {
            item.setLocationId(null);
            item.setRow(null);
            item.setCol(null);
        }
        // Kisten in einem gelöschten Regal werden freistehend.
        for (Location child : locations.findByParentLocationId(locationId)) {
            child.setParentLocationId(null);
            child.setRow(null);
            child.setCol(null);
        }
        locations.delete(location);
    }

    private void applyAndValidate(UUID depotId, Location location, LocationRequest req) {
        if (req.type() == LocationType.SHELF) {
            validateShelfGrid(req.gridRows(), req.gridCols());
            location.setGridRows(req.gridRows());
            location.setGridCols(req.gridCols());
            location.setParentLocationId(null);
            location.setRow(null);
            location.setCol(null);
        } else {
            // BOX: entweder in einem Regalfach oder freistehend.
            location.setGridRows(null);
            location.setGridCols(null);
            if (req.parentLocationId() != null) {
                placeBoxInShelf(depotId, location, req.parentLocationId(), req.row(), req.col());
            } else {
                location.setParentLocationId(null);
                location.setRow(null);
                location.setCol(null);
            }
        }
    }

    private void validateShelfGrid(Integer rows, Integer cols) {
        if (rows == null || cols == null) {
            throw new BusinessRuleException("Ein Regal braucht gridRows und gridCols (2×1 bis 8×8).");
        }
        if (rows < MIN_DIM || rows > MAX_DIM || cols < MIN_DIM || cols > MAX_DIM) {
            throw new BusinessRuleException("Regalgröße je Dimension zwischen 1 und 8.");
        }
        if (rows * cols < 2) {
            throw new BusinessRuleException("Ein Regal braucht mindestens 2 Fächer (min. 2×1).");
        }
    }

    private void placeBoxInShelf(UUID depotId, Location box, UUID shelfId, Integer row, Integer col) {
        Location shelf = getInDepot(depotId, shelfId);
        if (shelf.getType() != LocationType.SHELF) {
            throw new BusinessRuleException("Eine Kiste kann nur in einem Regal platziert werden.");
        }
        if (row == null || col == null) {
            throw new BusinessRuleException("Fach-Position (row, col) erforderlich.");
        }
        if (row < 0 || row >= shelf.getGridRows() || col < 0 || col >= shelf.getGridCols()) {
            throw new BusinessRuleException("Fach-Position liegt außerhalb des Regal-Rasters.");
        }
        assertBoxCellFree(shelfId, row, col, box.getId());
        box.setParentLocationId(shelfId);
        box.setRow(row);
        box.setCol(col);
    }

    /**
     * Regel "ein Fach enthält entweder eine Kiste ODER lose Items" — Sicht einer
     * Kiste, die in ein Fach gelegt wird: dort darf weder eine andere Kiste noch ein
     * loser Gegenstand liegen. {@code excludeBoxId} (kann {@code null} bei Neuanlage
     * sein) klammert die Kiste selbst aus, damit ein Verschieben aufs eigene Fach nicht
     * mit sich kollidiert.
     */
    void assertBoxCellFree(UUID shelfId, int row, int col, UUID excludeBoxId) {
        boolean otherBox = locations.findByParentLocationIdAndRowAndCol(shelfId, row, col).stream()
                .anyMatch(l -> !l.getId().equals(excludeBoxId));
        if (otherBox) {
            throw new BusinessRuleException("Fach %d/%d ist bereits durch eine Kiste belegt.".formatted(row, col));
        }
        if (!items.findByLocationIdAndRowAndCol(shelfId, row, col).isEmpty()) {
            throw new BusinessRuleException(
                    "Fach %d/%d enthält bereits lose Gegenstände.".formatted(row, col));
        }
    }

    /**
     * Regel-Sicht eines losen Gegenstands, der in ein Fach gelegt wird: dort darf keine
     * Kiste stehen. Mehrere lose Gegenstände im selben Fach sind erlaubt.
     */
    void assertLooseItemCellFree(UUID shelfId, int row, int col) {
        if (!locations.findByParentLocationIdAndRowAndCol(shelfId, row, col).isEmpty()) {
            throw new BusinessRuleException("Fach %d/%d ist bereits durch eine Kiste belegt.".formatted(row, col));
        }
    }

    // ---- Ansichten ----

    @Transactional(readOnly = true)
    public WarehouseView warehouse(UUID depotId) {
        List<Location> all = locations.findByDepotIdOrderByLabelAsc(depotId);
        List<Item> allItems = items.findByDepotIdOrderByNameAsc(depotId);
        // Offene Mängel einmal laden und je Ort zählen (statt pro Kiste erneut zu queryen).
        Map<UUID, Long> openDefectsByLocation = defects.findByDepotIdOrderByCreatedAtDesc(depotId).stream()
                .filter(d -> d.getStatus() == DefectStatus.OPEN && d.getLocationId() != null)
                .collect(Collectors.groupingBy(d -> d.getLocationId(), Collectors.counting()));

        List<ShelfView> shelves = new ArrayList<>();
        List<BoxView> freestanding = new ArrayList<>();

        for (Location loc : all) {
            if (loc.getType() != LocationType.SHELF) {
                continue;
            }
            List<CellView> cells = new ArrayList<>();
            for (int r = 0; r < loc.getGridRows(); r++) {
                for (int c = 0; c < loc.getGridCols(); c++) {
                    BoxView box = boxInCell(all, allItems, openDefectsByLocation, loc.getId(), r, c);
                    List<ItemResponse> loose = looseItemsInCell(allItems, loc.getId(), r, c);
                    if (box != null || !loose.isEmpty()) {
                        cells.add(new CellView(r, c, box, loose));
                    }
                }
            }
            shelves.add(new ShelfView(loc.getId(), loc.getLabel(), loc.getGridRows(), loc.getGridCols(), cells));
        }

        for (Location loc : all) {
            if (loc.getType() == LocationType.BOX && loc.getParentLocationId() == null) {
                freestanding.add(toBoxView(loc, allItems, openDefectsByLocation));
            }
        }

        List<ItemResponse> unassigned = allItems.stream()
                .filter(i -> i.getLocationId() == null)
                .map(ItemResponse::of)
                .toList();

        return new WarehouseView(shelves, freestanding, unassigned);
    }

    private BoxView boxInCell(List<Location> all, List<Item> allItems, Map<UUID, Long> openDefectsByLocation,
            UUID shelfId, int row, int col) {
        return all.stream()
                .filter(l -> l.getType() == LocationType.BOX
                        && shelfId.equals(l.getParentLocationId())
                        && Integer.valueOf(row).equals(l.getRow())
                        && Integer.valueOf(col).equals(l.getCol()))
                .findFirst()
                .map(l -> toBoxView(l, allItems, openDefectsByLocation))
                .orElse(null);
    }

    private List<ItemResponse> looseItemsInCell(List<Item> allItems, UUID shelfId, int row, int col) {
        return allItems.stream()
                .filter(i -> shelfId.equals(i.getLocationId())
                        && Integer.valueOf(row).equals(i.getRow())
                        && Integer.valueOf(col).equals(i.getCol()))
                .map(ItemResponse::of)
                .toList();
    }

    private BoxView toBoxView(Location box, List<Item> allItems, Map<UUID, Long> openDefectsByLocation) {
        int count = (int) allItems.stream().filter(i -> box.getId().equals(i.getLocationId())).count();
        int openDefects = openDefectsByLocation.getOrDefault(box.getId(), 0L).intValue();
        return new BoxView(box.getId(), box.getLabel(), count, openDefects);
    }

    @Transactional(readOnly = true)
    public BoxContentsView contents(UUID depotId, UUID locationId) {
        Location location = getInDepot(depotId, locationId);
        List<Item> boxItems = items.findByLocationId(locationId);
        List<ItemResponse> contents = boxItems.stream()
                .map(ItemResponse::of)
                .toList();
        Set<UUID> itemIds = boxItems.stream().map(Item::getId).collect(Collectors.toSet());
        // Offene Mängel: an der Kiste selbst ODER an einem ihrer Gegenstände.
        List<DefectSummary> openDefects = defects.findByDepotIdOrderByCreatedAtDesc(depotId).stream()
                .filter(d -> d.getStatus() == DefectStatus.OPEN)
                .filter(d -> locationId.equals(d.getLocationId())
                        || (d.getItemId() != null && itemIds.contains(d.getItemId())))
                .map(DefectSummary::of)
                .toList();
        return new BoxContentsView(location.getId(), location.getLabel(), contents, openDefects);
    }
}
