package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.web.ApiExceptions.NotFoundException;
import de.grauerreiter.jurtenburg.web.Dtos.DepotRequest;
import de.grauerreiter.jurtenburg.web.Dtos.DepotResponse;
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
@RequestMapping("/api/depots")
public class DepotController {

    private final DepotRepository depots;

    public DepotController(DepotRepository depots) {
        this.depots = depots;
    }

    @GetMapping
    public List<DepotResponse> list() {
        return depots.findAll().stream().map(DepotResponse::of).toList();
    }

    @GetMapping("/{depotId}")
    public DepotResponse get(@PathVariable UUID depotId) {
        return DepotResponse.of(load(depotId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepotResponse create(@Valid @RequestBody DepotRequest req) {
        return DepotResponse.of(depots.save(new Depot(req.name(), req.description())));
    }

    @PutMapping("/{depotId}")
    public DepotResponse update(@PathVariable UUID depotId, @Valid @RequestBody DepotRequest req) {
        Depot depot = load(depotId);
        depot.setName(req.name());
        depot.setDescription(req.description());
        return DepotResponse.of(depots.save(depot));
    }

    @DeleteMapping("/{depotId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID depotId) {
        depots.delete(load(depotId));
    }

    private Depot load(UUID depotId) {
        return depots.findById(depotId)
                .orElseThrow(() -> new NotFoundException("Lager nicht gefunden: " + depotId));
    }
}
