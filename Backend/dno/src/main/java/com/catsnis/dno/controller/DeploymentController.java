package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.DeploymentRequest;
import com.catsnis.dno.dto.DeploymentResponse;
import com.catsnis.dno.service.DeploymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deployments")
@RequiredArgsConstructor
public class DeploymentController {

    private final DeploymentService deploymentService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeploymentResponse>> getDeploymentById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(deploymentService.getDeploymentById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DeploymentResponse>>> getAllDeployments(
            Pageable pageable,
            @RequestParam(required = false) Integer regionId,
            @RequestParam(required = false) Integer districtId,
            @RequestParam(required = false) Integer healthId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                deploymentService.getAllDeployments(pageable, regionId, districtId, healthId, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeploymentResponse>> saveDeployment(
            @RequestBody DeploymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Déploiement créé avec succès",
                        deploymentService.saveDeployment(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeploymentResponse>> updateDeployment(
            @PathVariable Integer id,
            @RequestBody DeploymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Déploiement mis à jour avec succès",
                deploymentService.updateDeployment(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDeployment(@PathVariable Integer id) {
        deploymentService.deleteDeployment(id);
        return ResponseEntity.ok(ApiResponse.success("Déploiement supprimé avec succès", null));
    }

    // ✅ Retirer un équipement du déploiement → remet en stock DISPONIBLE
    @DeleteMapping("/{deploymentId}/items/{itemId}")
    public ResponseEntity<ApiResponse<DeploymentResponse>> removeItem(
            @PathVariable Integer deploymentId,
            @PathVariable Integer itemId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Équipement retiré et remis en stock",
                deploymentService.removeItemFromDeployment(deploymentId, itemId)));
    }

    // ✅ Téléchargement de la fiche PDF du déploiement
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Integer id) {
        byte[] pdf = deploymentService.generateDeploymentPdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fiche-deploiement-" + id + ".pdf")
                .body(pdf);
    }
}