package de.grauerreiter.jurtenburg;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
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
import org.springframework.web.context.WebApplicationContext;

/**
 * Audit-Log: erfolgreiche/fehlgeschlagene Logins und verändernde Operationen werden
 * protokolliert; die Admin-Ansicht liefert gefiltert und ist nur für Admins erreichbar.
 */
class AuditApiTest extends AbstractIntegrationTest {

    @Autowired
    WebApplicationContext context;

    @Autowired
    ObjectMapper json;

    private String id(String body, String field) throws Exception {
        return json.readTree(body).get(field).asText();
    }

    @Test
    void recordsLoginsAndMutationsAndFiltersForAdminsOnly() throws Exception {
        MockMvc admin = adminMockMvc(context);
        MockMvc anon = anonymousMockMvc(context);

        // Benutzer anlegen + freigeben.
        String uid = id(anon.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"audit@example.org\",\"displayName\":\"Audit\",\"password\":\"Passwort1\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "id");
        admin.perform(post("/api/admin/users/{id}/approve", uid)).andExpect(status().isOk());

        // Fehlgeschlagener Login → LOGIN_FAILED.
        anon.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"audit@example.org\",\"password\":\"falsch99\"}"))
                .andExpect(status().isUnauthorized());

        // Erfolgreicher Login → LOGIN.
        String token = id(anon.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"audit@example.org\",\"password\":\"Passwort1\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(), "token");

        // Verändernde Operation (Admin legt ein Lager an) → CREATE-Eintrag mit Pfad.
        admin.perform(post("/api/depots").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Audit-Lager\"}"))
                .andExpect(status().isCreated());

        // Admin-Ansicht: Login-Filter liefert unseren Benutzer.
        admin.perform(get("/api/admin/audit-logs").param("action", "LOGIN").param("actor", "audit@example.org"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].action", is("LOGIN")))
                .andExpect(jsonPath("$.content[0].actorUsername", is("audit@example.org")));

        // Fehlgeschlagener Login ist als LOGIN_FAILED protokolliert.
        admin.perform(get("/api/admin/audit-logs").param("action", "LOGIN_FAILED").param("actor", "audit@example.org"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].action", is("LOGIN_FAILED")));

        // Verändernde Operation ist als CREATE mit passendem Pfad protokolliert.
        admin.perform(get("/api/admin/audit-logs").param("action", "CREATE").param("q", "/api/depots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].action", is("CREATE")))
                .andExpect(jsonPath("$.content[0].method", is("POST")));

        // Audit ist nur für Admins: ein normaler Benutzer erhält 403.
        anon.perform(get("/api/admin/audit-logs").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
