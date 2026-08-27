package com.catsnis.dno.security;

import com.catsnis.dno.service.SystemStateAdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * NOUVEAU (27/08/2026) — bloque TOUTE requete (lecture et ecriture) quand
 * l'application est verrouillee, sauf pour :
 *   - le SEUL compte identifie par OwnerAccess.OWNER_EMAIL (meme un autre
 *     compte SUPER_ADMIN reste bloque — restriction demandee explicitement
 *     par Fanck le 27/08/2026, plus stricte qu'un simple role)
 *   - un petit nombre de routes explicitement exemptees (login, consultation
 *     du statut de verrouillage, preflight CORS)
 */
@Component
@RequiredArgsConstructor
public class SystemLockFilter extends OncePerRequestFilter {

    private final SystemStateAdminService systemStateAdminService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set<String> EXEMPT_PATHS = Set.of(
            "/api/auth/login",
            "/api/system/status"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!systemStateAdminService.isLocked()
                || "OPTIONS".equalsIgnoreCase(request.getMethod())
                || EXEMPT_PATHS.contains(request.getRequestURI())
                || request.getRequestURI().startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // ✅ MODIFIÉ (27/08/2026) — restriction par email exact, plus par role.
        if (OwnerAccess.isOwner(auth)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(423); // 423 Locked
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "success", false,
                "locked", true,
                "message", "Application temporairement suspendue. Contactez l'administrateur."
        )));
    }
}