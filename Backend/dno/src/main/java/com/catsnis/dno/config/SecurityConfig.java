package com.catsnis.dno.config;

import com.catsnis.dno.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService      userDetailsService;

    private static final String[] PUBLIC_URLS = {
            "/api/auth/login",
            "/api/images/file/**",
            "/images/**",
            "/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/actuator/**",          // ✅ AJOUT — health check mobile
            "/actuator/health"       // ✅ AJOUT — explicite
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth

                        // ── Preflight CORS ────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── URLs publiques ────────────────────────────────────────────────
                        .requestMatchers(PUBLIC_URLS).permitAll()

                        // ── Création de compte : SUPER_ADMIN uniquement ───────────────────
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").hasRole("SUPER_ADMIN")

                        // ── Acquisitions ──────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/acquisitions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Déploiements ──────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/deployments/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Interventions ─────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/interventions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Personnes ─────────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/persons/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Organisation ──────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/regions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .requestMatchers(HttpMethod.GET,    "/api/districts/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .requestMatchers(HttpMethod.GET,    "/api/health-sites/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/health-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/health-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/health-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Partenaires ───────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/partners/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/partners/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/partners/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/partners/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Types ─────────────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/types/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/types/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/types/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/types/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Assignation sites ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/technician-sites/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Paramètres ────────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/posts/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/posts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/posts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .requestMatchers(HttpMethod.GET,    "/api/units/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/units/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/units/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/units/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .requestMatchers(HttpMethod.GET,    "/api/apps/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/apps/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/apps/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/apps/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .requestMatchers(HttpMethod.GET,    "/api/evaluations/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/evaluations/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/evaluations/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/evaluations/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .requestMatchers(HttpMethod.GET,    "/api/states/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/states/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/states/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/states/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .requestMatchers(HttpMethod.GET,    "/api/images/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/images/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/images/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/images/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Booklets ──────────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/booklets/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Archives ──────────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/archives/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/archives/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/archives/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Notifications ─────────────────────────────────────────────────
                        .requestMatchers("/api/notifications/**").authenticated()

                        // ── Dashboard ─────────────────────────────────────────────────────
                        .requestMatchers("/api/dashboard/**").authenticated()

                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "https://catsnis-h1cq.vercel.app",
                "https://catsnis.vercel.app",
                "https://neon-cassata-5a6d1e.netlify.app",
                "https://catusnis.netlify.app"    // ✅ AJOUT
        ));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization"));
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}