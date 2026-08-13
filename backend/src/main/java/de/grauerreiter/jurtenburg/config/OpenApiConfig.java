package de.grauerreiter.jurtenburg.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI jurtenburgOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Jurtenburg API")
                .version("v1")
                .description("Lagersoftware für Pfadfinder-Zeltmaterial: Lager, Material, "
                        + "Bausätze, Aufräumorte (virtuelles Lager) und Mängelmeldungen."));
    }
}
