package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.PublicVehiculeResponse;
import com.catsnis.dno.service.VehiculeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Consultation PUBLIQUE d'une fiche véhicule (sans connexion),
 * destinée au flashage du QR code présent sur la fiche PDF.
 *
 * ⚠️ Le téléchargement du PDF authentifié (/pdf) vit dans VehiculeController,
 * pas ici — ce contrôleur ne doit exposer que des endpoints sans @PreAuthorize,
 * cohérents avec son préfixe /api/public/.
 */
@RestController
@RequestMapping("/api/public/vehicules")
@RequiredArgsConstructor
public class PublicVehiculeController {

    private final VehiculeService vehiculeService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicVehiculeResponse>> getPublicSummary(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                vehiculeService.getPublicSummary(id)));
    }
}