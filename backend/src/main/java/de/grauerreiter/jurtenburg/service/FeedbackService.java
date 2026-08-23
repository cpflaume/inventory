package de.grauerreiter.jurtenburg.service;

import de.grauerreiter.jurtenburg.config.FeedbackProperties;
import de.grauerreiter.jurtenburg.web.ApiExceptions.BusinessRuleException;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.ClientInfo;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.FeedbackRequest;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.FeedbackResponse;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.NavEntry;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Legt gemeldetes Feedback als GitHub-Issue im Projekt-Repo an. Der Aufruf an die GitHub-REST-API
 * läuft serverseitig, damit der Token (privates Repo!) nie das Frontend erreicht. Der eigentliche
 * Feedback-Text wird um den mitgelieferten Kontext (Seite, Client-Details, Navigationsverlauf) und
 * den anmeldenden Benutzer angereichert.
 */
@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);
    /** Titel bleibt kompakt — der volle Text steht im Body. */
    private static final int MAX_TITLE_LENGTH = 80;

    private final FeedbackProperties props;
    private final RestClient restClient;

    public FeedbackService(FeedbackProperties props, RestClient.Builder restClientBuilder) {
        this.props = props;
        this.restClient = restClientBuilder.build();
    }

    /**
     * Erzeugt aus dem Feedback ein GitHub-Issue und gibt Nummer + Link zurück.
     *
     * @param reporter        anmeldender Benutzer (aus dem App-JWT), für die Nachvollziehbarkeit
     * @param userAgentHeader User-Agent aus dem Request-Header (Fallback, falls das Frontend keinen mitschickt)
     */
    public FeedbackResponse submit(FeedbackRequest req, String reporter, String userAgentHeader) {
        if (!props.isConfigured()) {
            throw new BusinessRuleException("Feedback ist nicht konfiguriert.");
        }
        String title = buildTitle(req.message());
        String body = buildBody(req, reporter, userAgentHeader);

        Map<String, Object> payload = Map.of(
                "title", title,
                "body", body,
                "labels", props.labelList());

        try {
            GithubIssue issue = restClient.post()
                    .uri(props.getApiBaseUrl() + "/repos/{owner}/{repo}/issues", props.owner(), props.repo())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + props.getToken())
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .header("X-GitHub-Api-Version", "2022-11-28")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(GithubIssue.class);
            if (issue == null) {
                throw new BusinessRuleException("Feedback konnte nicht angelegt werden (leere Antwort von GitHub).");
            }
            String url = issue.html_url() == null ? "" : issue.html_url();
            log.info("Feedback als Issue #{} angelegt ({})", issue.number(), url);
            return new FeedbackResponse(issue.number(), url);
        } catch (RestClientException ex) {
            // Details serverseitig loggen, dem Client eine neutrale Meldung zurückgeben (kein Token-Leak).
            log.error("Feedback-Issue konnte nicht bei GitHub angelegt werden", ex);
            throw new BusinessRuleException("Feedback konnte nicht an GitHub übermittelt werden.");
        }
    }

    /** Erste, gekürzte Zeile des Textes als Issue-Titel (mit Präfix). */
    private static String buildTitle(String message) {
        String firstLine = message.strip().lines().findFirst().orElse("").strip();
        if (firstLine.isBlank()) {
            firstLine = "Feedback";
        }
        if (firstLine.length() > MAX_TITLE_LENGTH) {
            firstLine = firstLine.substring(0, MAX_TITLE_LENGTH - 1).strip() + "…";
        }
        return "Feedback: " + firstLine;
    }

    /** Markdown-Body: Feedback-Text plus ein Kontextblock aus den mitgelieferten Metadaten. */
    private static String buildBody(FeedbackRequest req, String reporter, String userAgentHeader) {
        StringBuilder sb = new StringBuilder();
        sb.append(req.message().strip()).append("\n\n");
        sb.append("---\n\n### Kontext\n\n");
        appendRow(sb, "Gemeldet von", reporter);
        appendRow(sb, "Zeitpunkt", Instant.now().toString());
        appendRow(sb, "Seite", req.path());
        appendRow(sb, "URL", req.url());

        ClientInfo client = req.client();
        if (client != null) {
            appendRow(sb, "Browser/Client", firstNonBlank(client.userAgent(), userAgentHeader));
            appendRow(sb, "Gerätetyp", client.deviceType());
            appendRow(sb, "Plattform", client.platform());
            appendRow(sb, "Sprache", client.language());
            appendRow(sb, "Fenster", client.viewport());
            appendRow(sb, "Bildschirm", client.screen());
            appendRow(sb, "Zeitzone", client.timezone());
        } else {
            appendRow(sb, "Browser/Client", userAgentHeader);
        }

        List<NavEntry> history = req.history();
        if (history != null && !history.isEmpty()) {
            sb.append("\n**Navigationsverlauf** (neueste zuletzt):\n\n");
            for (NavEntry entry : history) {
                sb.append("- ");
                if (entry.at() != null && !entry.at().isBlank()) {
                    sb.append('`').append(sanitize(entry.at())).append("` ");
                }
                sb.append(sanitize(entry.path())).append('\n');
            }
        }
        return sb.toString();
    }

    /** Eine Tabellenzeile „**Label:** Wert" — leere Werte werden übersprungen. */
    private static void appendRow(StringBuilder sb, String label, String value) {
        if (value != null && !value.isBlank()) {
            sb.append("- **").append(label).append(":** ").append(sanitize(value)).append('\n');
        }
    }

    private static String firstNonBlank(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }

    /**
     * Backticks entfernen, damit vom Client gelieferter Text den Markdown-Codespan im Verlauf
     * nicht aufbricht, und Zeilenumbrüche zu Leerzeichen glätten (einzeilige Werte).
     */
    private static String sanitize(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("`", "'").replace("\r", " ").replace("\n", " ").strip();
    }

    /**
     * Teilausschnitt der GitHub-Issue-Antwort (nur was wir zurückgeben). Die Komponentennamen
     * entsprechen absichtlich dem JSON von GitHub ({@code number}, {@code html_url}), sodass Jackson
     * ohne Zusatz-Annotation bindet; übrige Felder der Antwort werden ignoriert.
     */
    private record GithubIssue(int number, String html_url) {
    }
}
