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
            "/actuator/health",
            "/actuator/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth

                        // ── Preflight CORS ────────────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── URLs publiques ────────────────────────────────
                        .requestMatchers(PUBLIC_URLS).permitAll()

                        // ── Création de compte ────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").hasRole("SUPER_ADMIN")

                        // ── Acquisitions ──────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/acquisitions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Déploiements ──────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/deployments/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Interventions ─────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/interventions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Personnes ─────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/persons/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Organisation ──────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/regions/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/districts/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/health-sites/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/healths/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.POST,   "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.POST,   "/api/health-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Partenaires / Types / Posts / Units / Apps ────
                        .requestMatchers(HttpMethod.GET,    "/api/partners/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/types/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/posts/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/units/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/apps/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/evaluations/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/states/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/images/**").authenticated()

                        // ── Assignation sites ─────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/technician-sites/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Booklets ──────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/booklets/**").authenticated()
                        .requestMatchers(HttpMethod.GET,    "/api/booklet-status/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Archives ──────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/archives/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/archives/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/archives/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Dashboard ─────────────────────────────────────
                        .requestMatchers("/api/dashboard/**").authenticated()

                        // ── Véhicules & Fournitures ───────────────────────
                        .requestMatchers(HttpMethod.GET, "/api/vehicules/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/fournitures/**").authenticated()

                        // ✅ Notifications — ajout explicite
                        .requestMatchers(HttpMethod.GET,    "/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.PUT,    "/api/notifications/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/notifications/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // ✅ CORS centralisé ici — supprimer CorsConfig.java pour éviter le conflit
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.onrender.com",
                "https://*.netlify.app",
                "capacitor://localhost",
                "ionic://localhost"
        ));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(false);
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