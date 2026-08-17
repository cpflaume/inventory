package de.grauerreiter.jurtenburg;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

/**
 * Standardfall ohne OIDC (app.oidc.enabled=false): {@code /config} meldet {@code enabled=false}
 * und der Login-Endpunkt existiert faktisch nicht (404). Nutzt den Default-Kontext.
 */
class OidcDisabledApiTest extends AbstractIntegrationTest {

    @Autowired
    WebApplicationContext context;

    @Test
    void configReportsDisabledAndLoginIsAbsent() throws Exception {
        MockMvc anon = anonymousMockMvc(context);

        anon.perform(get("/api/auth/oidc/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled", Matchers.is(false)));

        anon.perform(get("/api/auth/oidc/login"))
                .andExpect(status().isNotFound());
    }
}
