package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.service.KitService;
import de.grauerreiter.jurtenburg.web.Dtos.KitInstantiateRequest;
import de.grauerreiter.jurtenburg.web.Dtos.KitInstantiationResponse;
import de.grauerreiter.jurtenburg.web.Dtos.KitRequest;
import de.grauerreiter.jurtenburg.web.Dtos.KitResponse;
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
@RequestMapping("/api/depots/{depotId}/kits")
public class KitController {

    private final KitService kitService;

    public KitController(KitService kitService) {
        this.kitService = kitService;
    }

    @GetMapping
    public List<KitResponse> list(@PathVariable UUID depotId) {
        return kitService.list(depotId);
    }

    /** Stückliste eines Bausatzes ("was gehört zu diesem Zelt", druckbar). */
    @GetMapping("/{kitId}")
    public KitResponse get(@PathVariable UUID depotId, @PathVariable UUID kitId) {
        return kitService.get(depotId, kitId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KitResponse create(@PathVariable UUID depotId, @Valid @RequestBody KitRequest req) {
        return kitService.create(depotId, req);
    }

    @PutMapping("/{kitId}")
    public KitResponse update(@PathVariable UUID depotId, @PathVariable UUID kitId,
            @Valid @RequestBody KitRequest req) {
        return kitService.update(depotId, kitId, req);
    }

    @DeleteMapping("/{kitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID depotId, @PathVariable UUID kitId) {
        kitService.delete(depotId, kitId);
    }

    /** Bausatz ins Lager übernehmen: neue Kiste + alle Positionen als neue Gegenstände. */
    @PostMapping("/{kitId}/instantiate")
    @ResponseStatus(HttpStatus.CREATED)
    public KitInstantiationResponse instantiate(@PathVariable UUID depotId, @PathVariable UUID kitId,
            @Valid @RequestBody KitInstantiateRequest req) {
        return kitService.instantiate(depotId, kitId, req);
    }
}
