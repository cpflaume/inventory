package de.grauerreiter.jurtenburg.web;

import de.grauerreiter.jurtenburg.config.FeedbackProperties;
import de.grauerreiter.jurtenburg.security.AppUserDetails;
import de.grauerreiter.jurtenburg.security.SecurityUtils;
import de.grauerreiter.jurtenburg.service.FeedbackService;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.FeedbackConfigResponse;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.FeedbackRequest;
import de.grauerreiter.jurtenburg.web.FeedbackDtos.FeedbackResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Nutzer-Feedback aus der App. {@code GET /config} sagt dem Frontend, ob der Feedback-Button
 * erscheinen soll; {@code POST} legt ein GitHub-Issue an (angemeldete Benutzer). Die verändernde
 * Anfrage wird — wie alle Mutationen — automatisch vom {@code AuditFilter} protokolliert.
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackProperties props;
    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackProperties props, FeedbackService feedbackService) {
        this.props = props;
        this.feedbackService = feedbackService;
    }

    /** Ob der Feedback-Button angezeigt werden soll (aktiv und vollständig konfiguriert). */
    @GetMapping("/config")
    public FeedbackConfigResponse config() {
        return new FeedbackConfigResponse(props.isConfigured());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FeedbackResponse submit(@Valid @RequestBody FeedbackRequest req, HttpServletRequest http) {
        AppUserDetails user = SecurityUtils.currentUser();
        String reporter = user != null ? user.getUsername() : "unbekannt";
        return feedbackService.submit(req, reporter, http.getHeader(HttpHeaders.USER_AGENT));
    }
}
