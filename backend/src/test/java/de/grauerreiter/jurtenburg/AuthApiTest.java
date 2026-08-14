package de.grauerreiter.jurtenburg;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

/**
 * End-to-end der Benutzerverwaltung: Registrierung → PENDING → Login gesperrt →
 * Admin-Freigabe → Login → JWT → Lager-Zugriff erst nach Gruppe→Lager-Mapping.
 */
class AuthApiTest extends AbstractIntegrationTest {

    @Autowired
    WebApplicationContext context;

    @Autowired
    ObjectMapper json;

    private String id(String body, String field) throws Exception {
        return json.readTree(body).get(field).asText();
    }

    @Test
    void registrationApprovalAndGroupBasedDepotAccess() throws Exception {
        MockMvc admin = adminMockMvc(context);
        MockMvc anon = anonymousMockMvc(context);

        // 1) Registrierung → 201, PENDING.
        String userBody = anon.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"erika\",\"password\":\"Passwort1\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andReturn().getResponse().getContentAsString();
        String erikaId = id(userBody, "id");

        // 2) Login vor Freigabe → 401.
        anon.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"erika\",\"password\":\"Passwort1\"}"))
                .andExpect(status().isUnauthorized());

        // 3) Admin gibt frei.
        admin.perform(post("/api/admin/users/{id}/approve", erikaId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ACTIVE")));

        // 4) Login → 200 + Token.
        String loginBody = anon.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"erika\",\"password\":\"Passwort1\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = id(loginBody, "token");
        String bearer = "Bearer " + token;

        // 5) Admin legt ein Lager an.
        String depotId = id(admin.perform(post("/api/depots").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Mandant-Lager\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "id");

        // 6) Erika ohne Gruppe → kein Zugriff (403).
        anon.perform(get("/api/depots/{d}/warehouse", depotId).header("Authorization", bearer))
                .andExpect(status().isForbidden());

        // 7) Admin: Gruppe anlegen, auf Lager mappen (EDITOR), Erika der Gruppe zuweisen.
        String groupId = id(admin.perform(post("/api/admin/groups").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Team A\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "id");
        admin.perform(post("/api/admin/groups/{g}/depots", groupId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"depotId\":\"" + depotId + "\",\"role\":\"EDITOR\"}"))
                .andExpect(status().isOk());
        admin.perform(post("/api/admin/users/{u}/groups", erikaId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"groupId\":\"" + groupId + "\"}"))
                .andExpect(status().isOk());

        // 8) Jetzt Zugriff (200) — Rechte werden pro Request frisch geladen.
        anon.perform(get("/api/depots/{d}/warehouse", depotId).header("Authorization", bearer))
                .andExpect(status().isOk());

        // 9) /me zeigt das Lager mit Rolle EDITOR.
        anon.perform(get("/api/auth/me").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username", is("erika")))
                .andExpect(jsonPath("$.depots[0].role", is("EDITOR")));

        // 10) Kein Admin-Zugriff für normalen Benutzer (403).
        anon.perform(get("/api/admin/users").header("Authorization", bearer))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestsAreRejected() throws Exception {
        anonymousMockMvc(context).perform(get("/api/depots"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cannotRemoveLastActiveAdmin() throws Exception {
        MockMvc admin = adminMockMvc(context);
        // Der Bootstrap-Admin ist der einzige aktive Admin.
        String usersBody = admin.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String adminId = null;
        for (var node : json.readTree(usersBody)) {
            if ("ADMIN".equals(node.get("systemRole").asText())
                    && "ACTIVE".equals(node.get("status").asText())) {
                adminId = node.get("id").asText();
                break;
            }
        }
        org.junit.jupiter.api.Assertions.assertNotNull(adminId, "Bootstrap-Admin erwartet");

        // Weder degradieren …
        admin.perform(post("/api/admin/users/{id}/system-role", adminId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"systemRole\":\"USER\"}"))
                .andExpect(status().isConflict());
        // … noch sperren.
        admin.perform(post("/api/admin/users/{id}/status", adminId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISABLED\"}"))
                .andExpect(status().isConflict());
    }
}
