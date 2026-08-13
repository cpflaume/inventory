package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.service.ItemService;
import de.grauerreiter.jurtenburg.web.Dtos.ItemRequest;
import de.grauerreiter.jurtenburg.web.Dtos.ItemResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/depots/{depotId}/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    public List<ItemResponse> list(@PathVariable UUID depotId) {
        return itemService.list(depotId).stream().map(ItemResponse::of).toList();
    }

    @GetMapping("/{itemId}")
    public ItemResponse get(@PathVariable UUID depotId, @PathVariable UUID itemId) {
        return ItemResponse.of(itemService.getInDepot(depotId, itemId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(@PathVariable UUID depotId, @Valid @RequestBody ItemRequest req) {
        return ItemResponse.of(itemService.create(depotId, req));
    }

    @PutMapping("/{itemId}")
    public ItemResponse update(@PathVariable UUID depotId, @PathVariable UUID itemId,
            @Valid @RequestBody ItemRequest req) {
        return ItemResponse.of(itemService.update(depotId, itemId, req));
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID depotId, @PathVariable UUID itemId) {
        itemService.delete(depotId, itemId);
    }
}
