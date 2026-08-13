package de.grauerreiter.jurtenburg.config;

import de.grauerreiter.jurtenburg.domain.ConditionFlag;
import de.grauerreiter.jurtenburg.domain.DefectReport;
import de.grauerreiter.jurtenburg.domain.Depot;
import de.grauerreiter.jurtenburg.domain.Item;
import de.grauerreiter.jurtenburg.domain.Kit;
import de.grauerreiter.jurtenburg.domain.KitPosition;
import de.grauerreiter.jurtenburg.domain.Location;
import de.grauerreiter.jurtenburg.domain.LocationType;
import de.grauerreiter.jurtenburg.domain.Severity;
import de.grauerreiter.jurtenburg.repo.DefectReportRepository;
import de.grauerreiter.jurtenburg.repo.DepotRepository;
import de.grauerreiter.jurtenburg.repo.ItemRepository;
import de.grauerreiter.jurtenburg.repo.KitRepository;
import de.grauerreiter.jurtenburg.repo.LocationRepository;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Legt beim Start ein kleines Beispiel-Lager an, damit das virtuelle Lager
 * lokal sofort etwas zeigt. Über {@code app.seed-demo=false} (prod) abschaltbar.
 */
@Configuration
@ConditionalOnProperty(name = "app.seed-demo", havingValue = "true", matchIfMissing = true)
public class DemoDataSeeder {

    @Bean
    CommandLineRunner seedDemoData(DepotRepository depots, LocationRepository locations,
            ItemRepository items, KitRepository kits, DefectReportRepository defects) {
        return args -> {
            if (depots.count() > 0) {
                return;
            }
            Depot depot = depots.save(new Depot("Stamm Grauer Reiter",
                    "Beispiel-Lager mit Jurten, Kothen und Werkzeug."));
            UUID depotId = depot.getId();

            // Ein Regal 3×3 …
            Location shelf = new Location(depotId, LocationType.SHELF, "Regal A");
            shelf.setGridRows(3);
            shelf.setGridCols(3);
            shelf = locations.save(shelf);

            // … mit einer Kiste im Fach (0,0) …
            Location boxDach = new Location(depotId, LocationType.BOX, "Kiste 1 · Jurtendach");
            boxDach.setParentLocationId(shelf.getId());
            boxDach.setRow(0);
            boxDach.setCol(0);
            boxDach = locations.save(boxDach);

            // … und einer freistehenden Kiste (unter den Regalen).
            Location boxHeringe = locations.save(new Location(depotId, LocationType.BOX, "Kiste 5 · Heringe & Abspanner"));

            // Eine Jurte als Baum aus Teilen.
            Item jurte = items.save(new Item(depotId, "Jurte 8m"));
            jurte.setCategory("Zelt");
            items.save(jurte);

            Item dach = new Item(depotId, "Jurtendach");
            dach.setParentItemId(jurte.getId());
            dach.setCategory("Zeltteil");
            dach.setLocationId(boxDach.getId());
            items.save(dach);

            Item planen = new Item(depotId, "Seitenplanen (Satz)");
            planen.setParentItemId(jurte.getId());
            planen.setCategory("Zeltteil");
            planen.setQuantity(8);
            items.save(planen);

            Item heringe = new Item(depotId, "Heringe");
            heringe.setParentItemId(jurte.getId());
            heringe.setCategory("Kleinteil");
            heringe.setQuantity(40);
            heringe.setLocationId(boxHeringe.getId());
            items.save(heringe);

            Item hammer = new Item(depotId, "Hammer");
            hammer.setCategory("Werkzeug");
            hammer.setConditionFlag(ConditionFlag.YELLOW);
            hammer.setNote("Stiel leicht angerissen.");
            items.save(hammer);

            // Bausatz = Stückliste "was gehört zu einer Jurte".
            Kit kit = new Kit(depotId, "Bausatz Jurte 8m", "Vollständige Jurte, ausgepackt aufbaubar.");
            kit.addPosition(new KitPosition("Jurtendach", 1, dach.getId()));
            kit.addPosition(new KitPosition("Seitenplanen", 8, planen.getId()));
            kit.addPosition(new KitPosition("Heringe", 40, heringe.getId()));
            kit.addPosition(new KitPosition("Gestänge", 1, null));
            kits.save(kit);

            // Eine offene Mängelmeldung.
            DefectReport defect = new DefectReport(depotId, "Loch in Seitenplane", Severity.MACKE);
            defect.setItemId(planen.getId());
            defect.setLocationId(boxDach.getId());
            defect.setDescription("Handtellergroßes Loch, sollte vor dem nächsten Lager geflickt werden.");
            defect.setReporter("Demo");
            defects.save(defect);
        };
    }
}
