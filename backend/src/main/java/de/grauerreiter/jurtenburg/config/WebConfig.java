package de.grauerreiter.jurtenburg.config;

import de.grauerreiter.jurtenburg.security.DepotAccessInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registriert den {@link DepotAccessInterceptor} für die Lager-Routen. CORS wird
 * zentral in der {@code SecurityConfig} gehandhabt.
 */
@Configuration
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
