package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;

import com.catsnis.dno.dto.PublicDeploymentResponse;
import com.catsnis.dno.service.DeploymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Consultation PUBLIQUE d'une fiche de déploiement (sans connexion),
 * destinée au flashage du QR code présent sur la fiche PDF.
 */
@RestController
@RequestMapping("/api/public/deployments")
@RequiredArgsConstructor


public class PublicDeploymentController {

    private final DeploymentService deploymentService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublicDeploymentResponse>> getPublicSummary(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                deploymentService.getPublicSummary(id)));
    }

}
