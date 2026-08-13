package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.web.Dtos.ItemResponse;
import java.util.List;
import java.util.UUID;

/**
 * Aggregierte Ansichts-DTOs für das virtuelle Lager und die Druckansichten.
 */
public final class Views {

    private Views() {
    }

    /** Eine Kiste inkl. Kurz-Statistik für die Regal-/Freistehend-Darstellung. */
    public record BoxView(UUID id, String label, int itemCount, int openDefects) {
    }

    /** Ein Fach (row,col) im Regal: entweder eine Kiste ODER lose Items. */
    public record CellView(int row, int col, BoxView box, List<ItemResponse> looseItems) {
    }

    /** Ein Regal mit seinem Fach-Raster. */
    public record ShelfView(UUID id, String label, int gridRows, int gridCols, List<CellView> cells) {
    }

    /**
     * Das komplette virtuelle Lager aus Anwendersicht: Regale mit Fächern,
     * freistehende Kisten (unter den Regalen) und nicht einsortierte Items.
     */
    public record WarehouseView(
            List<ShelfView> shelves,
            List<BoxView> freestandingBoxes,
            List<ItemResponse> unassignedItems) {
    }

    /** Druckbarer Beipackzettel: Inhalt einer Kiste (oder eines Fachs). */
    public record BoxContentsView(UUID locationId, String label, List<ItemResponse> items) {
    }

    /** Eine Gruppe der Bestandsliste (nach Ort gruppiert). */
    public record InventoryGroup(UUID locationId, String locationLabel, List<ItemResponse> items) {
    }

    /** Druckbare Bestandsliste eines Lagers. */
    public record InventoryView(String depotName, List<InventoryGroup> groups, int totalItems) {
    }
}
