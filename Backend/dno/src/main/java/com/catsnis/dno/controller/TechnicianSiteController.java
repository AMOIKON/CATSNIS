package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.TechnicianSiteRequest;
import com.catsnis.dno.dto.TechnicianSiteResponse;
import com.catsnis.dno.service.TechnicianSiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technician-sites")
@RequiredArgsConstructor
public class TechnicianSiteController {

    private final TechnicianSiteService technicianSiteService;

    // ✅ Assigner un site à un technicien
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<TechnicianSiteResponse>> assign(
            @RequestBody TechnicianSiteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Site assigné avec succès",
                        technicianSiteService.assign(request)));
    }

    // ✅ Mettre à jour une assignation
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<TechnicianSiteResponse>> update(
            @PathVariable Integer id,
            @RequestBody TechnicianSiteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Assignation mise à jour",
                technicianSiteService.update(id, request)));
    }

    // ✅ Sites d'un technicien — URL canonique
    @GetMapping("/technician/{personId}")
    public ResponseEntity<ApiResponse<List<TechnicianSiteResponse>>> getByTechnician(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(ApiResponse.success(
                technicianSiteService.getByTechnician(personId)));
    }

    // ✅ Alias utilisé par le DashboardService frontend
    @GetMapping("/by-person/{personId}")
    public ResponseEntity<ApiResponse<List<TechnicianSiteResponse>>> getByPerson(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(ApiResponse.success(
                technicianSiteService.getByTechnician(personId)));
    }

    // ✅ Supprimer une assignation
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unassign(
            @PathVariable Integer id) {
        technicianSiteService.unassign(id);
        return ResponseEntity.ok(ApiResponse.success(
                "Assignation supprimée avec succès", null));
    }

    // ✅ IDs des sites d'un technicien (pour filtrage frontend)
    @GetMapping("/technician/{personId}/health-ids")
    public ResponseEntity<ApiResponse<List<Integer>>> getHealthIds(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(ApiResponse.success(
                technicianSiteService.getHealthIdsByTechnician(personId)));
    }

    // ✅ IDs des régions d'un technicien
    @GetMapping("/technician/{personId}/region-ids")
    public ResponseEntity<ApiResponse<List<Integer>>> getRegionIds(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(ApiResponse.success(
                technicianSiteService.getRegionIdsByTechnician(personId)));
    }

    // ✅ IDs des districts d'un technicien
    @GetMapping("/technician/{personId}/district-ids")
    public ResponseEntity<ApiResponse<List<Integer>>> getDistrictIds(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(ApiResponse.success(
                technicianSiteService.getDistrictIdsByTechnician(personId)));
    }
}