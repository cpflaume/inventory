package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.ConditionFlag;
import de.grauerreiter.jurtenburg.domain.Item;
import de.grauerreiter.jurtenburg.domain.Location;
import de.grauerreiter.jurtenburg.domain.LocationType;
import de.grauerreiter.jurtenburg.domain.Severity;
import de.grauerreiter.jurtenburg.repo.ItemRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.BusinessRuleException;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.ItemRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Material/Gegenstände inkl. Zuweisung an einen Aufräumort (Kiste oder Regalfach).
 */
@Service
public class ItemService {

    private final ItemRepository items;
    private final LocationService locationService;

    public ItemService(ItemRepository items, LocationService locationService) {
        this.items = items;
        this.locationService = locationService;
    }

    public List<Item> list(UUID depotId) {
        return items.findByDepotIdOrderByNameAsc(depotId);
    }

    public Item getInDepot(UUID depotId, UUID itemId) {
        Item item = items.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item nicht gefunden: " + itemId));
        if (!item.getDepotId().equals(depotId)) {
            throw new NotFoundException("Item gehört nicht zu diesem Lager: " + itemId);
        }
        return item;
    }

    @Transactional
    public Item create(UUID depotId, ItemRequest req) {
        Item item = new Item(depotId, req.name());
        apply(depotId, item, req);
        return items.save(item);
    }

    @Transactional
    public Item update(UUID depotId, UUID itemId, ItemRequest req) {
        Item item = getInDepot(depotId, itemId);
        item.setName(req.name());
        apply(depotId, item, req);
        return items.save(item);
    }

    @Transactional
    public void delete(UUID depotId, UUID itemId) {
        items.delete(getInDepot(depotId, itemId));
    }

    /**
     * Passt die Zustands-Ampel eines Items an einen neu gemeldeten Mangel an:
     * MACKE hebt (mindestens) auf GELB, DEFEKT auf ROT. Es wird nur verschärft,
     * nie abgeschwächt — eine kleine Macke macht ein bereits defektes Teil nicht
     * wieder heil.
     */
    @Transactional
    public void escalateForDefect(UUID depotId, UUID itemId, Severity severity) {
        ConditionFlag target = severity == Severity.DEFEKT ? ConditionFlag.RED : ConditionFlag.YELLOW;
        Item item = getInDepot(depotId, itemId);
        if (target.ordinal() > item.getConditionFlag().ordinal()) {
            item.setConditionFlag(target);
            items.save(item);
        }
    }

    private void apply(UUID depotId, Item item, ItemRequest req) {
        item.setCategory(req.category());
        item.setQuantity(req.quantity());
        item.setNote(req.note());
        item.setConditionFlag(req.conditionFlag() == null ? ConditionFlag.GREEN : req.conditionFlag());

        if (req.parentItemId() != null) {
            Item parent = getInDepot(depotId, req.parentItemId());
            if (parent.getId().equals(item.getId())) {
                throw new BusinessRuleException("Ein Item kann nicht sein eigenes übergeordnetes Teil sein.");
            }
            item.setParentItemId(parent.getId());
        } else {
            item.setParentItemId(null);
        }

        assignLocation(depotId, item, req);
    }

    /**
     * Legt das Item entweder in eine Kiste oder lose in ein Regalfach — mit
     * Durchsetzung der Regel "Fach: Kiste XOR lose Items".
     */
    private void assignLocation(UUID depotId, Item item, ItemRequest req) {
        if (req.locationId() == null) {
            item.setLocationId(null);
            item.setRow(null);
            item.setCol(null);
            return;
        }
        Location location = locationService.getInDepot(depotId, req.locationId());
        if (location.getType() == LocationType.BOX) {
            item.setLocationId(location.getId());
            item.setRow(null);
            item.setCol(null);
        } else {
            // Lose in einem Regalfach.
            if (req.row() == null || req.col() == null) {
                throw new BusinessRuleException("Für ein Regal muss ein Fach (row, col) angegeben werden.");
            }
            if (req.row() < 0 || req.row() >= location.getGridRows()
                    || req.col() < 0 || req.col() >= location.getGridCols()) {
                throw new BusinessRuleException("Fach-Position liegt außerhalb des Regal-Rasters.");
            }
            locationService.assertLooseItemCellFree(location.getId(), req.row(), req.col());
            item.setLocationId(location.getId());
            item.setRow(req.row());
            item.setCol(req.col());
        }
    }
}
