package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.domain.Kit;
import de.grauerreiter.jurtenburg.domain.KitPosition;
import de.grauerreiter.jurtenburg.repo.KitRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.KitPositionRequest;
import de.grauerreiter.jurtenburg.web.Dtos.KitRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bausätze (Vorkonfiguration eines vollständigen Zelts) und ihre druckbare Stückliste.
 */
@Service
public class KitService {

    private final KitRepository kits;

    public KitService(KitRepository kits) {
        this.kits = kits;
    }

    public List<Kit> list(UUID depotId) {
        return kits.findByDepotIdOrderByNameAsc(depotId);
    }

    @Transactional(readOnly = true)
    public Kit getInDepot(UUID depotId, UUID kitId) {
        Kit kit = kits.findById(kitId)
                .orElseThrow(() -> new NotFoundException("Bausatz nicht gefunden: " + kitId));
        if (!kit.getDepotId().equals(depotId)) {
            throw new NotFoundException("Bausatz gehört nicht zu diesem Lager: " + kitId);
        }
        // Positionen innerhalb der Transaktion initialisieren (lazy collection).
        kit.getPositions().size();
        return kit;
    }

    @Transactional
    public Kit create(UUID depotId, KitRequest req) {
        Kit kit = new Kit(depotId, req.name(), req.description());
        applyPositions(kit, req);
        return kits.save(kit);
    }

    @Transactional
    public Kit update(UUID depotId, UUID kitId, KitRequest req) {
        Kit kit = getInDepot(depotId, kitId);
        kit.setName(req.name());
        kit.setDescription(req.description());
        kit.clearPositions();
        applyPositions(kit, req);
        return kits.save(kit);
    }

    @Transactional
    public void delete(UUID depotId, UUID kitId) {
        kits.delete(getInDepot(depotId, kitId));
    }

    private void applyPositions(Kit kit, KitRequest req) {
        if (req.positions() == null) {
            return;
        }
        for (KitPositionRequest p : req.positions()) {
            kit.addPosition(new KitPosition(p.label(), p.targetQuantity(), p.itemId()));
        }
    }
}
