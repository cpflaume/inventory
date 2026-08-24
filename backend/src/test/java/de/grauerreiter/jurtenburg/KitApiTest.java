package de.grauerreiter.jurtenburg;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * Bausätze/Stücklisten. Regression für den Lazy-Loading-Fehler: das Auflisten der
 * Bausätze muss die Positionen mitliefern (Mapping innerhalb der Transaktion), sonst
 * gäbe es bei {@code open-in-view: false} eine LazyInitializationException.
 */
class KitApiTest extends AbstractIntegrationTest {

    @Autowired
    WebApplicationContext context;

    @Autowired
    ObjectMapper json;

    MockMvc mvc() {
        return adminMockMvc(context);
    }

    private String createDepot(String name) throws Exception {
        String body = mvc().perform(post("/api/depots").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asText();
    }

    @Test
    void createAndListKitWithPositions() throws Exception {
        MockMvc mvc = mvc();
        String depotId = createDepot("Bausatz-Lager");

        String kitJson = """
                {"name":"Bausatz Jurte 8m","description":"Vollständige Jurte",
                 "positions":[{"label":"Jurtendach","targetQuantity":1},
                              {"label":"Heringe","targetQuantity":40}]}
                """;
        mvc.perform(post("/api/depots/{d}/kits", depotId).contentType(MediaType.APPLICATION_JSON).content(kitJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.positions", hasSize(2)));

        // Listen-Endpoint (Regression F1): darf NICHT mit LazyInitializationException 500en.
        mvc.perform(get("/api/depots/{d}/kits", depotId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].positions", hasSize(2)))
                .andExpect(jsonPath("$[0].positions[0].label", is("Jurtendach")))
                .andExpect(jsonPath("$[0].positions[1].targetQuantity", is(40)));
    }

    @Test
    void instantiateKitCreatesBoxWithItems() throws Exception {
        MockMvc mvc = mvc();
        String depotId = createDepot("Übernahme-Lager");

        String kitJson = """
                {"name":"Bausatz Kothe","description":"Schwarzzelt",
                 "positions":[{"label":"Kothenbahnen","targetQuantity":4},
                              {"label":"Heringe","targetQuantity":20}]}
                """;
        String kitBody = mvc.perform(post("/api/depots/{d}/kits", depotId)
                        .contentType(MediaType.APPLICATION_JSON).content(kitJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String kitId = json.readTree(kitBody).get("id").asText();

        // Bausatz ins Lager übernehmen → neue Kiste mit 2 Gegenständen.
        String result = mvc.perform(post("/api/depots/{d}/kits/{k}/instantiate", depotId, kitId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"boxLabel\":\"Kothe – Neu\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.boxLabel", is("Kothe – Neu")))
                .andExpect(jsonPath("$.itemCount", is(2)))
                .andReturn().getResponse().getContentAsString();
        String boxId = json.readTree(result).get("boxId").asText();

        // Die neue Kiste steht als freistehende Kiste im virtuellen Lager …
        mvc.perform(get("/api/depots/{d}/warehouse", depotId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.freestandingBoxes", hasSize(1)))
                .andExpect(jsonPath("$.freestandingBoxes[0].itemCount", is(2)));

        // … und ihr Beipackzettel führt die frisch angelegten Gegenstände mit Soll-Menge.
        mvc.perform(get("/api/depots/{d}/locations/{l}/contents", depotId, boxId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(2)));
    }
}
