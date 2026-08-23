package de.grauerreiter.jurtenburg.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Feedback-Funktion: aus der App gemeldetes Nutzer-Feedback wird als GitHub-Issue im Projekt-Repo
 * angelegt. Standardmäßig <em>deaktiviert</em> — ohne {@code app.feedback.enabled=true} erscheint
 * der Feedback-Button im Frontend nicht und der Endpunkt lehnt ab.
 *
 * <p>Aktiviert man Feedback, müssen {@link #token} (ein GitHub-Token mit {@code issues:write} auf
 * das — private — Repo) und {@link #repository} ({@code owner/repo}) gesetzt sein. Der Token bleibt
 * ausschließlich serverseitig; das Frontend erfährt nur, ob Feedback aktiv ist.</p>
 */
@ConfigurationProperties(prefix = "app.feedback")
public class FeedbackProperties {

    /** Schaltet die Feedback-Funktion scharf. Ist sie aus, existiert der Button nicht. */
    private boolean enabled = false;

    /** GitHub-Token (Fine-grained oder klassisch) mit {@code issues:write} auf {@link #repository}. */
    private String token = "";

    /** Ziel-Repository als {@code owner/repo}, z.B. {@code cpflaume/inventory}. */
    private String repository = "";

    /** Basis-URL der GitHub-REST-API (für GitHub Enterprise anpassbar). */
    private String apiBaseUrl = "https://api.github.com";

    /** Labels, die jedem Feedback-Issue gesetzt werden (kommagetrennt). */
    private String labels = "feedback";

    public boolean isEnabled() {
        return enabled;
    }

    /** Aktiv <em>und</em> vollständig konfiguriert (Token + Repo gesetzt). */
    public boolean isConfigured() {
        return enabled && !token.isBlank() && !repository.isBlank();
    }

    /** Owner-Teil von {@link #repository} ({@code owner/repo}). */
    public String owner() {
        return repository.contains("/") ? repository.substring(0, repository.indexOf('/')) : repository;
    }

    /** Repo-Teil von {@link #repository} ({@code owner/repo}). */
    public String repo() {
        return repository.contains("/") ? repository.substring(repository.indexOf('/') + 1) : "";
    }

    /** Labels als Liste (leere Einträge werden verworfen). */
    public List<String> labelList() {
        return Arrays.stream(labels.split("[,]")).map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token == null ? "" : token;
    }

    public String getRepository() {
        return repository;
    }

    public void setRepository(String repository) {
        // Führende/abschließende Slashes und Whitespace tolerieren.
        this.repository = repository == null ? "" : repository.trim().replaceAll("^/+|/+$", "");
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public void setApiBaseUrl(String apiBaseUrl) {
        // Trailing-Slash normalisieren, damit die zusammengesetzte URL robust ist.
        this.apiBaseUrl = apiBaseUrl == null || apiBaseUrl.isBlank()
                ? "https://api.github.com" : apiBaseUrl.replaceAll("/+$", "");
    }

    public String getLabels() {
        return labels;
    }

    public void setLabels(String labels) {
        this.labels = labels == null ? "" : labels;
    }
}
