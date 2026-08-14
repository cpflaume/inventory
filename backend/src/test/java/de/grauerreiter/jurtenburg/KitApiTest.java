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
}
