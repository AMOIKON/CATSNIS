package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.PublicInterventionResponse;
import com.catsnis.dno.service.InterventionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Consultation PUBLIQUE d'une fiche d'intervention (sans connexion), destinée
 * au flashage du QR code présent sur la fiche PDF. N'expose que des
 * informations déjà visibles sur ce document (pas d'email, pas de contact).
 */
@RestController
@RequestMapping("/api/public/interventions")
@RequiredArgsConstructor
public class PublicInterventionController {

    private final InterventionService interventionService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicInterventionResponse>> getPublicSummary(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                interventionService.getPublicSummary(id)));
    }
}