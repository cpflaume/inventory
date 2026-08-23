package de.grauerreiter.jurtenburg;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import de.grauerreiter.jurtenburg.config.FeedbackProperties;
import de.grauerreiter.jurtenburg.service.FeedbackService;
import de.grauerreiter.jurtenburg.web.ApiExceptions.BusinessRuleException;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.ClientInfo;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.FeedbackRequest;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.FeedbackResponse;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.NavEntry;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/**
 * Feedback wird als GitHub-Issue angelegt: der Aufruf trägt Auth-Header und einen aus Text +
 * Kontext gebauten Body; die Antwort (Nummer/Link) wird durchgereicht. Ohne Konfiguration lehnt
 * der Service ab (kein Netzaufruf). Der GitHub-Call ist per {@link MockRestServiceServer} gemockt.
 */
class FeedbackServiceTest {

    private static FeedbackProperties configuredProps() {
        FeedbackProperties props = new FeedbackProperties();
        props.setEnabled(true);
        props.setToken("secret-token");
        props.setRepository("cpflaume/inventory");
        props.setLabels("feedback, ui");
        return props;
    }

    @Test
    void createsGithubIssueWithContextAndReturnsNumberAndUrl() {
        FeedbackProperties props = configuredProps();
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        FeedbackService service = new FeedbackService(props, builder);

        server.expect(requestTo("https://api.github.com/repos/cpflaume/inventory/issues"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer secret-token"))
                .andExpect(header("Accept", "application/vnd.github+json"))
                .andExpect(jsonPath("$.title").value(startsWith("Feedback: Regal-Ansicht")))
                .andExpect(jsonPath("$.labels[0]").value("feedback"))
                .andExpect(jsonPath("$.labels[1]").value("ui"))
                .andExpect(jsonPath("$.body").value(containsString("Regal-Ansicht hakt")))
                // Kontext landet im Body.
                .andExpect(jsonPath("$.body").value(containsString("audrey@example.org")))
                .andExpect(jsonPath("$.body").value(containsString("/lager/1/material")))
                .andExpect(jsonPath("$.body").value(containsString("Firefox")))
                .andExpect(jsonPath("$.body").value(containsString("Navigationsverlauf")))
                .andRespond(withStatus(HttpStatus.CREATED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"number\":123,\"html_url\":\"https://github.com/cpflaume/inventory/issues/123\"}"));

        FeedbackRequest req = new FeedbackRequest(
                "Regal-Ansicht hakt\nMehr Details hier.",
                "/lager/1/material",
                "https://app.example.org/lager/1/material",
                new ClientInfo("Mozilla/5.0 Firefox/120", "de-DE", "Linux", "Desktop",
                        "1280x800", "1920x1080", "Europe/Berlin"),
                List.of(new NavEntry("/lager/1", "2026-08-23T10:00:00Z"),
                        new NavEntry("/lager/1/material", "2026-08-23T10:01:00Z")));

        FeedbackResponse res = service.submit(req, "audrey@example.org", "header-agent");

        assertThat(res.issueNumber()).isEqualTo(123);
        assertThat(res.issueUrl()).isEqualTo("https://github.com/cpflaume/inventory/issues/123");
        server.verify();
    }

    @Test
    void rejectsWhenNotConfigured() {
        FeedbackProperties props = new FeedbackProperties(); // enabled=false
        FeedbackService service = new FeedbackService(props, RestClient.builder());

        FeedbackRequest req = new FeedbackRequest("Hallo", null, null, null, null);
        assertThatThrownBy(() -> service.submit(req, "a@b.c", null))
                .isInstanceOf(BusinessRuleException.class);
    }
}
