package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.common.utils.SecurityUtils;
import com.catsnis.dno.entity.Person;
import com.catsnis.dno.entity.SystemStateAdmin;
import com.catsnis.dno.security.OwnerAccess;
import com.catsnis.dno.service.SystemStateAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * NOUVEAU (27/08/2026) — verrouillage/deverrouillage administratif de
 * l'application, reserve au SEUL compte OwnerAccess.OWNER_EMAIL — meme
 * un autre compte SUPER_ADMIN reçoit un 403 (voir checkOwnerOrThrow()).
 */
@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemStateAdminController {

    private final SystemStateAdminService systemStateAdminService;
    private final SecurityUtils securityUtils;

    /**
     * Consultable par tout le monde, meme verrouille ou non authentifie —
     * permet au frontend d'afficher un ecran de blocage explicite.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        SystemStateAdmin state = systemStateAdminService.getState();
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "locked", state.isLocked(),
                "reason", state.getReason() != null ? state.getReason() : ""
        )));
    }

    @PostMapping("/lock")
    public ResponseEntity<ApiResponse<?>> lock(@RequestBody Map<String, String> body) {
        Person admin = checkOwnerOrThrow();
        String reason = body.getOrDefault("reason", "");
        SystemStateAdmin state = systemStateAdminService.lock(reason, admin);
        return ResponseEntity.ok(ApiResponse.success("Application verrouillée", state));
    }

    @PostMapping("/unlock")
    public ResponseEntity<ApiResponse<?>> unlock() {
        Person admin = checkOwnerOrThrow();
        SystemStateAdmin state = systemStateAdminService.unlock(admin);
        return ResponseEntity.ok(ApiResponse.success("Application déverrouillée", state));
    }

    /**
     * ✅ NOUVEAU — remplace @PreAuthorize("hasRole('SUPER_ADMIN')") : verifie
     * l'email exact plutot que le role, pour que le verrouillage reste
     * reserve a une seule personne meme si d'autres comptes SUPER_ADMIN
     * existent.
     */
    private Person checkOwnerOrThrow() {
        Person current = securityUtils.getCurrentUserOrThrow();
        if (!OwnerAccess.isOwner(current)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Action reservee a l'administrateur principal.");
        }
        return current;
    }
}