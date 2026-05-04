package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.DeploymentRequest;
import com.catsnis.dno.dto.DeploymentResponse;
import com.catsnis.dno.service.DeploymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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
        return ResponseEntity.ok(ApiResponse.success(deploymentService.getAllDeployments(pageable, regionId, districtId, healthId, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeploymentResponse>> saveDeployment(@RequestBody DeploymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Déploiement créé avec succès", deploymentService.saveDeployment(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeploymentResponse>> updateDeployment(
            @PathVariable Integer id,
            @RequestBody DeploymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Déploiement mis à jour avec succès", deploymentService.updateDeployment(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDeployment(@PathVariable Integer id) {
        deploymentService.deleteDeployment(id);
        return ResponseEntity.ok(ApiResponse.success("Déploiement supprimé avec succès", null));
    }


}
