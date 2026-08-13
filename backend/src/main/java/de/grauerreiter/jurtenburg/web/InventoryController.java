package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.service.InventoryService;
import de.grauerreiter.jurtenburg.web.Views.InventoryView;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/depots/{depotId}")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /** Druckbare Bestandsliste (nach Aufräumort gruppiert). */
    @GetMapping("/inventory")
    public InventoryView inventory(@PathVariable UUID depotId) {
        return inventoryService.inventory(depotId);
    }
}
