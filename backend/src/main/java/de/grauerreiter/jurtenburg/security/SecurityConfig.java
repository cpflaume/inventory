package de.grauerreiter.jurtenburg.security;

import de.grauerreiter.jurtenburg.service.AuditService;
import tools.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties({JwtProperties.class, OidcProperties.class})
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final String[] allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter, AuditService auditService, ObjectMapper objectMapper,
            @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174}") String allowedOrigins) {
        this.jwtFilter = jwtFilter;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.allowedOrigins = allowedOrigins.split("\\s*,\\s*");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            ObjectProvider<OidcLoginConfigurer> oidcLoginConfigurer) throws Exception {
        // Nur vorhanden, wenn app.oidc.enabled=true — dann wird der bibliotheksbasierte OIDC-Login
        // (oauth2Login) angedockt. Ist OIDC aus, bleibt die Kette rein lokal (App-JWT).
        OidcLoginConfigurer oidc = oidcLoginConfigurer.getIfAvailable();
        if (oidc != null) {
            oidc.configure(http);
        }
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> writeError(res, 401, "Nicht angemeldet"))
                        .accessDeniedHandler((req, res, e) -> writeError(res, 403, "Kein Zugriff")))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                        // OIDC-Login-Flow (Weiterleitung zum IdP, Callback) und der Status fürs Frontend.
                        .requestMatchers(HttpMethod.GET, "/api/auth/oidc/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        // Fehler-Dispatch freigeben: läuft eine permitAll-Route (z.B. der OIDC-Login) in
                        // eine ungefangene Exception, dispatcht Spring intern nach /error. Ohne Freigabe
                        // liefe dieser Dispatch anonym in anyRequest().authenticated() → der echte 5xx würde
                        // als irreführender 401 "Nicht angemeldet" maskiert.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/v3/api-docs").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                // Hinter der Autorisierung: der Principal ist gesetzt und der Status steht fest,
                // sodass jede verändernde Anfrage vollständig protokolliert werden kann.
                .addFilterAfter(new AuditFilter(auditService), AuthorizationFilter.class);
        return http.build();
    }

    private void writeError(jakarta.servlet.http.HttpServletResponse res, int status, String message) {
        try {
            res.setStatus(status);
            res.setContentType("application/json");
            res.getWriter().write(objectMapper.writeValueAsString(Map.of("status", status, "message", message)));
        } catch (Exception ignored) {
            // Response bereits committed — nichts zu tun.
        }
    }
}
