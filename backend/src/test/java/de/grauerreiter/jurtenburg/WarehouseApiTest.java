package de.grauerreiter.jurtenburg;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * End-to-end durch die REST-Schicht: Lager → Regal → Kiste → Item, virtuelles
 * Lager, Beipackzettel, Fach-XOR-Regel und Mandantentrennung.
 */
class WarehouseApiTest extends AbstractIntegrationTest {

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
    void fullWalkingSkeletonFlow() throws Exception {
        MockMvc mvc = mvc();
        String depotId = createDepot("Test-Lager");

        // Regal 2x2 anlegen.
        String shelfBody = mvc.perform(post("/api/depots/{d}/locations", depotId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"SHELF\",\"label\":\"Regal A\",\"gridRows\":2,\"gridCols\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.gridRows", is(2)))
                .andReturn().getResponse().getContentAsString();
        String shelfId = json.readTree(shelfBody).get("id").asText();

        // Kiste ins Fach (0,0).
        String boxBody = mvc.perform(post("/api/depots/{d}/locations", depotId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"BOX\",\"label\":\"Kiste 1\",\"parentLocationId\":\"" + shelfId
                                + "\",\"row\":0,\"col\":0}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String boxId = json.readTree(boxBody).get("id").asText();

        // Item in die Kiste.
        mvc.perform(post("/api/depots/{d}/items", depotId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Jurtendach\",\"quantity\":1,\"locationId\":\"" + boxId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locationId", is(boxId)));

        // Virtuelles Lager: ein Regal mit einer belegten Zelle, keine freistehenden Kisten.
        mvc.perform(get("/api/depots/{d}/warehouse", depotId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shelves", hasSize(1)))
                .andExpect(jsonPath("$.shelves[0].cells", hasSize(1)))
                .andExpect(jsonPath("$.shelves[0].cells[0].box.itemCount", is(1)))
                .andExpect(jsonPath("$.freestandingBoxes", hasSize(0)));

        // Beipackzettel der Kiste.
        mvc.perform(get("/api/depots/{d}/locations/{l}/contents", depotId, boxId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label", is("Kiste 1")))
                .andExpect(jsonPath("$.items", hasSize(1)));

        // Mängelmeldung absenden.
        mvc.perform(post("/api/depots/{d}/defect-reports", depotId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Loch\",\"severity\":\"MACKE\",\"locationId\":\"" + boxId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("OPEN")));
    }

    @Test
    void fachXorRuleRejectsLooseItemInCellWithBox() throws Exception {
        MockMvc mvc = mvc();
        String depotId = createDepot("XOR-Lager");

        String shelfBody = mvc.perform(post("/api/depots/{d}/locations", depotId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"SHELF\",\"label\":\"Regal\",\"gridRows\":1,\"gridCols\":2}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String shelfId = json.readTree(shelfBody).get("id").asText();

        // Kiste in Fach (0,0).
        mvc.perform(post("/api/depots/{d}/locations", depotId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"BOX\",\"label\":\"Kiste\",\"parentLocationId\":\"" + shelfId
                                + "\",\"row\":0,\"col\":0}"))
                .andExpect(status().isCreated());

        // Loses Item ins selbe Fach (0,0) → 422.
        mvc.perform(post("/api/depots/{d}/items", depotId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hammer\",\"quantity\":1,\"locationId\":\"" + shelfId
                                + "\",\"row\":0,\"col\":0}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void defectReportRejectsForeignItemReference() throws Exception {
        MockMvc mvc = mvc();
        String depotA = createDepot("Lager-A");
        String depotB = createDepot("Lager-B");

        String itemBody = mvc.perform(post("/api/depots/{d}/items", depotA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dach\",\"quantity\":1}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String itemId = json.readTree(itemBody).get("id").asText();

        // Mängelmeldung in Lager B, die ein Item aus Lager A referenziert → 404.
        mvc.perform(post("/api/depots/{d}/defect-reports", depotB).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Loch\",\"severity\":\"MACKE\",\"itemId\":\"" + itemId + "\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void tenantIsolationHidesForeignDepotEntities() throws Exception {
        MockMvc mvc = mvc();
        String depotA = createDepot("Lager-A");
        String depotB = createDepot("Lager-B");

        String boxBody = mvc.perform(post("/api/depots/{d}/locations", depotA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"BOX\",\"label\":\"Kiste A\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String boxId = json.readTree(boxBody).get("id").asText();

        // Zugriff aus Lager B auf die Kiste von Lager A → 404.
        mvc.perform(get("/api/depots/{d}/locations/{l}", depotB, boxId))
                .andExpect(status().isNotFound());

        // Warehouse von B ist leer.
        JsonNode warehouseB = json.readTree(mvc.perform(get("/api/depots/{d}/warehouse", depotB))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        org.junit.jupiter.api.Assertions.assertEquals(0, warehouseB.get("freestandingBoxes").size());
    }
}
