package de.grauerreiter.jurtenburg.config;

import de.grauerreiter.jurtenburg.security.DepotAccessInterceptor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registriert den {@link DepotAccessInterceptor} für die Lager-Routen. CORS wird
 * zentral in der {@code SecurityConfig} gehandhabt. Bindet zudem die Feedback-Konfiguration
 * ({@link FeedbackProperties}, Präfix {@code app.feedback}).
 */
@Configuration
@EnableConfigurationProperties(FeedbackProperties.class)
public class WebConfig implements WebMvcConfigurer {

    private final DepotAccessInterceptor depotAccessInterceptor;

    public WebConfig(DepotAccessInterceptor depotAccessInterceptor) {
        this.depotAccessInterceptor = depotAccessInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(depotAccessInterceptor).addPathPatterns("/api/depots/**");
    }
}
