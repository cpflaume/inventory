package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.Kit;
import de.grauerreiter.jurtenburg.domain.KitPosition;
import de.grauerreiter.jurtenburg.repo.KitRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.KitPositionRequest;
import de.grauerreiter.jurtenburg.web.Dtos.KitRequest;
import de.grauerreiter.jurtenburg.web.Dtos.KitResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bausätze (Vorkonfiguration eines vollständigen Zelts) und ihre druckbare Stückliste.
 *
 * <p>Alle öffentlichen Methoden geben {@link KitResponse}-DTOs zurück, gemappt
 * <em>innerhalb</em> der Transaktion. Das ist bewusst so: {@code Kit.positions} ist lazy und
 * {@code open-in-view} ist aus — würde erst der Controller mappen, käme es zur
 * LazyInitializationException.</p>
 */
@Service
public class KitService {

    private final KitRepository kits;
    private final ItemService itemService;

    public KitService(KitRepository kits, ItemService itemService) {
        this.kits = kits;
        this.itemService = itemService;
    }

    @Transactional(readOnly = true)
    public List<KitResponse> list(UUID depotId) {
        return kits.findByDepotIdOrderByNameAsc(depotId).stream().map(KitResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public KitResponse get(UUID depotId, UUID kitId) {
        return KitResponse.of(getEntityInDepot(depotId, kitId));
    }

    @Transactional
    public KitResponse create(UUID depotId, KitRequest req) {
        Kit kit = new Kit(depotId, req.name(), req.description());
        applyPositions(depotId, kit, req);
        return KitResponse.of(kits.save(kit));
    }

    @Transactional
    public KitResponse update(UUID depotId, UUID kitId, KitRequest req) {
        Kit kit = getEntityInDepot(depotId, kitId);
        kit.setName(req.name());
        kit.setDescription(req.description());
        kit.clearPositions();
        applyPositions(depotId, kit, req);
        return KitResponse.of(kits.save(kit));
    }

    @Transactional
    public void delete(UUID depotId, UUID kitId) {
        kits.delete(getEntityInDepot(depotId, kitId));
    }

    private Kit getEntityInDepot(UUID depotId, UUID kitId) {
        Kit kit = kits.findById(kitId)
                .orElseThrow(() -> new NotFoundException("Bausatz nicht gefunden: " + kitId));
        if (!kit.getDepotId().equals(depotId)) {
            throw new NotFoundException("Bausatz gehört nicht zu diesem Lager: " + kitId);
        }
        return kit;
    }

    private void applyPositions(UUID depotId, Kit kit, KitRequest req) {
        if (req.positions() == null) {
            return;
        }
        for (KitPositionRequest p : req.positions()) {
            if (p.itemId() != null) {
                // Referenziertes Item muss zum selben Lager gehören (Mandantentrennung).
                itemService.getInDepot(depotId, p.itemId());
            }
            kit.addPosition(new KitPosition(p.label(), p.targetQuantity(), p.itemId()));
        }
    }
}
