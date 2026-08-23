package de.grauerreiter.jurtenburg;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

/**
 * Feedback-Endpunkte: der Status ist authentifiziert und meldet ohne Konfiguration {@code enabled=false};
 * POST verlangt einen nicht-leeren Text und lehnt ohne Konfiguration fachlich ab. Ohne Anmeldung: 401.
 * (Der eigentliche GitHub-Aufruf ist in {@link FeedbackServiceTest} isoliert getestet.)
 */
class FeedbackApiTest extends AbstractIntegrationTest {

    @Autowired
    WebApplicationContext context;

    @Test
    void configReportsDisabledByDefaultAndPostIsRejectedWithoutConfiguration() throws Exception {
        MockMvc admin = adminMockMvc(context);

        // Ohne Token/Repo ist Feedback aus → Button erscheint nicht.
        admin.perform(get("/api/feedback/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        // Leerer Text → Bean-Validation (400).
        admin.perform(post("/api/feedback").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"   \"}"))
                .andExpect(status().isBadRequest());

        // Gültiger Text, aber Feedback nicht konfiguriert → fachlich abgelehnt (422), kein GitHub-Aufruf.
        admin.perform(post("/api/feedback").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Tolle App!\",\"path\":\"/lager/1\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void requiresAuthentication() throws Exception {
        MockMvc anon = anonymousMockMvc(context);
        anon.perform(get("/api/feedback/config")).andExpect(status().isUnauthorized());
        anon.perform(post("/api/feedback").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Hallo\"}"))
                .andExpect(status().isUnauthorized());
    }
}
