package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.repo.LocationRepository;
import de.grauerreiter.jurtenburg.service.LocationService;
import de.grauerreiter.jurtenburg.web.Dtos.LocationRequest;
import de.grauerreiter.jurtenburg.web.Dtos.LocationResponse;
import de.grauerreiter.jurtenburg.web.Views.BoxContentsView;
import de.grauerreiter.jurtenburg.web.Views.WarehouseView;
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
@RequestMapping("/api/depots/{depotId}")
public class LocationController {

    private final LocationService locationService;
    private final LocationRepository locations;

    public LocationController(LocationService locationService, LocationRepository locations) {
        this.locationService = locationService;
        this.locations = locations;
    }

    /** Flache Liste aller Aufräumorte des Lagers. */
    @GetMapping("/locations")
    public List<LocationResponse> list(@PathVariable UUID depotId) {
        return locations.findByDepotIdOrderByLabelAsc(depotId).stream().map(LocationResponse::of).toList();
    }

    /** Das virtuelle Lager: Regale mit Fächern, freistehende Kisten, nicht einsortierte Items. */
    @GetMapping("/warehouse")
    public WarehouseView warehouse(@PathVariable UUID depotId) {
        return locationService.warehouse(depotId);
    }

    @GetMapping("/locations/{locationId}")
    public LocationResponse get(@PathVariable UUID depotId, @PathVariable UUID locationId) {
        return LocationResponse.of(locationService.getInDepot(depotId, locationId));
    }

    /** Beipackzettel: Inhalt einer Kiste/eines Orts (druckbar). */
    @GetMapping("/locations/{locationId}/contents")
    public BoxContentsView contents(@PathVariable UUID depotId, @PathVariable UUID locationId) {
        return locationService.contents(depotId, locationId);
    }

    @PostMapping("/locations")
    @ResponseStatus(HttpStatus.CREATED)
    public LocationResponse create(@PathVariable UUID depotId, @Valid @RequestBody LocationRequest req) {
        return LocationResponse.of(locationService.create(depotId, req));
    }

    @PutMapping("/locations/{locationId}")
    public LocationResponse update(@PathVariable UUID depotId, @PathVariable UUID locationId,
            @Valid @RequestBody LocationRequest req) {
        return LocationResponse.of(locationService.update(depotId, locationId, req));
    }

    @DeleteMapping("/locations/{locationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID depotId, @PathVariable UUID locationId) {
        locationService.delete(depotId, locationId);
    }
}
