package com.catsnis.dno.config;

import com.catsnis.dno.security.JwtAuthenticationFilter;
import com.catsnis.dno.security.SystemLockFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
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
    // ✅ NOUVEAU (27/08/2026) — voir addFilterAfter() plus bas
    private final SystemLockFilter        systemLockFilter;

    // ── Chain prioritaire pour Actuator ───────────────────────────────────────
    @Bean
    @Order(1)
    public SecurityFilterChain actuatorFilterChain(HttpSecurity http) throws Exception {
        return http
                .securityMatcher("/actuator/**")
                .cors(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth

                        // ── Preflight OPTIONS ────────────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ── Endpoints publics ────────────────────────────────
                        .requestMatchers(
                                "/api/auth/login",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/api/public/**"
                        ).permitAll()

                        // ✅ NOUVEAU (27/08/2026) — consultable même sans être
                        // connecté, pour que le frontend puisse afficher l'écran
                        // de verrouillage avant même la tentative de login.
                        .requestMatchers(HttpMethod.GET, "/api/system/status").permitAll()
                        .requestMatchers("/api/system/lock", "/api/system/unlock").hasRole("SUPER_ADMIN")

                        // ── Images publiques — DOIT être avant /api/images/** ─
                        // FIX: la règle GET /api/images/** authenticated() ci-dessous
                        // écrasait cette règle. On la place ici, en premier.
                        .requestMatchers(HttpMethod.GET, "/api/images/file/**").permitAll()
                        .requestMatchers("/images/**").permitAll()

                        // ── Auth ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").hasRole("SUPER_ADMIN")

                        // ── Acquisitions ─────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/acquisitions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/acquisitions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Deployments ──────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/deployments/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/deployments/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")

                        // ── Interventions ─────────────────────────────────────
                        // ✅ LOGISTICIEN ajouté sur POST/PUT — même logique de
                        //    périmètre géographique que TECHNICIEN (filtrage EN_LIGNE
                        //    appliqué côté service InterventionServiceImpl).
                        .requestMatchers(HttpMethod.GET,    "/api/interventions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN","LOGISTICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN","LOGISTICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/interventions/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Persons ───────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/persons/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/persons/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Regions ───────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/regions/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Districts ─────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/districts/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/districts/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Health Sites ──────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/health-sites/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/health-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/health-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/health-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Partners ──────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/partners/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/partners/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/partners/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/partners/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Types ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/types/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/types/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/types/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/types/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Technician Sites ──────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/technician-sites/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.PUT,    "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/technician-sites/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Posts ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/posts/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/posts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/posts/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Units ─────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/units/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/units/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/units/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/units/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Apps ──────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/apps/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/apps/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/apps/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/apps/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Evaluations ───────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/evaluations/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/evaluations/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/evaluations/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/evaluations/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── States ────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/states/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/states/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/states/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/states/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Images (hors /file/** déjà permis ci-dessus) ──────
                        .requestMatchers(HttpMethod.GET,    "/api/images/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/images/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/images/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/images/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Booklets ──────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/booklets/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.PUT,    "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/booklets/**").hasAnyRole("SUPER_ADMIN","ADMIN")
                        // ── Structure Etatiques ──────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,  "/api/structures-etatiques/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/structures-etatiques/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN","LOGISTICIEN")


                        // ── Archives ──────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,    "/api/archives/**").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/archives/**").hasAnyRole("SUPER_ADMIN","ADMIN","TECHNICIEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/archives/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        // ── Divers ────────────────────────────────────────────
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/dashboard/**").authenticated()

                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                // ✅ NOUVEAU (27/08/2026) — s'execute APRES l'authentification JWT,
                // pour que le role de l'utilisateur soit deja connu au moment de
                // decider si la requete doit etre bloquee (verrouillage global).
                .addFilterAfter(systemLockFilter, JwtAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // ── Config pour les routes authentifiées (avec credentials) ──────────
        CorsConfiguration authConfig = new CorsConfiguration();
        authConfig.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "https://catsnis-h1cq.vercel.app",
                "https://catsnis.vercel.app",
                "https://neon-cassata-5a6d1e.netlify.app",
                "https://catusnis.netlify.app"
        ));
        authConfig.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        authConfig.setAllowedHeaders(List.of("*"));
        authConfig.setAllowCredentials(true);
        authConfig.setExposedHeaders(List.of("Authorization"));
        authConfig.setMaxAge(3600L);

        // ── Config spécifique pour /api/images/file/** (sans credentials) ────
        // allowCredentials(true) est INCOMPATIBLE avec allowedOrigins("*").
        // Les images publiques n'ont pas besoin de credentials.
        CorsConfiguration imageConfig = new CorsConfiguration();
        imageConfig.setAllowedOriginPatterns(List.of("*"));
        imageConfig.setAllowedMethods(List.of("GET", "OPTIONS"));
        imageConfig.setAllowedHeaders(List.of("*"));
        imageConfig.setAllowCredentials(false);
        imageConfig.setMaxAge(86400L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // ⚠ L'ordre compte : la règle la plus spécifique EN PREMIER
        source.registerCorsConfiguration("/api/images/file/**", imageConfig);
        source.registerCorsConfiguration("/**", authConfig);
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