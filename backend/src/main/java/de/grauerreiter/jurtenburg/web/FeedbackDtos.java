package de.grauerreiter.jurtenburg.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTOs der Feedback-Funktion. Das Frontend schickt neben dem eigentlichen Text noch Kontext mit
 * (aktuelle Seite, Client-Details, Navigationsverlauf), damit das erzeugte GitHub-Issue nachvollziehbar ist.
 */
public final class FeedbackDtos {

    private FeedbackDtos() {
    }

    /** Vom Frontend gesendetes Feedback samt optionalem Kontext. */
    public record FeedbackRequest(
            @NotBlank @Size(max = 5000) String message,
            /** Wohin der Benutzer zuletzt navigiert war (Route-Pfad, z.B. {@code /lager/…/material}). */
            @Size(max = 2000) String path,
            /** Vollständige URL der aktuellen Ansicht. */
            @Size(max = 2000) String url,
            ClientInfo client,
            List<NavEntry> history) {
    }

    /** Client-/Gerätedetails, soweit der Browser sie preisgibt. */
    public record ClientInfo(
            @Size(max = 1000) String userAgent,
            @Size(max = 100) String language,
            @Size(max = 100) String platform,
            @Size(max = 50) String deviceType,
            @Size(max = 50) String viewport,
            @Size(max = 50) String screen,
            @Size(max = 100) String timezone) {
    }

    /** Ein Eintrag im Navigationsverlauf (Pfad + Zeitpunkt als ISO-String). */
    public record NavEntry(@Size(max = 2000) String path, @Size(max = 40) String at) {
    }

    /** Öffentlicher Status: ob der Feedback-Button erscheinen soll. */
    public record FeedbackConfigResponse(boolean enabled) {
    }

    /** Antwort nach erfolgreichem Anlegen: Nummer und Link des GitHub-Issues. */
    public record FeedbackResponse(int issueNumber, String issueUrl) {
    }
}
