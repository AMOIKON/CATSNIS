package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.TechnicianSiteRequest;
import com.catsnis.dno.dto.TechnicianSiteResponse;
import com.catsnis.dno.service.TechnicianSiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technician-sites")
@RequiredArgsConstructor
public class TechnicianSiteController {

    private final TechnicianSiteService technicianSiteService;

    // ── Assigner ──────────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<TechnicianSiteResponse>> assign(
            @RequestBody TechnicianSiteRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.assign(request)));
    }

    // ── Modifier ──────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<TechnicianSiteResponse>> update(
            @PathVariable Integer id,
            @RequestBody TechnicianSiteRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.update(id, request)));
    }

    // ── Sites d'une personne — deux alias pour compatibilité ─────────────────
    @GetMapping("/technician/{personId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TechnicianSiteResponse>>> getByTechnician(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getByTechnician(personId)));
    }

    // ✅ Alias /person/{personId} — même méthode
    @GetMapping("/person/{personId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TechnicianSiteResponse>>> getByPerson(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getByTechnician(personId)));
    }

    // ── IDs utilitaires — deux alias ─────────────────────────────────────────
    @GetMapping("/technician/{personId}/health-ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Integer>>> getHealthIds(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getHealthIdsByTechnician(personId)));
    }

    @GetMapping("/person/{personId}/health-ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Integer>>> getHealthIdsByPerson(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getHealthIdsByTechnician(personId)));
    }

    @GetMapping("/technician/{personId}/region-ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Integer>>> getRegionIds(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getRegionIdsByTechnician(personId)));
    }

    @GetMapping("/person/{personId}/region-ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Integer>>> getRegionIdsByPerson(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getRegionIdsByTechnician(personId)));
    }

    @GetMapping("/technician/{personId}/district-ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Integer>>> getDistrictIds(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getDistrictIdsByTechnician(personId)));
    }

    @GetMapping("/person/{personId}/district-ids")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Integer>>> getDistrictIdsByPerson(
            @PathVariable Integer personId) {
        return ResponseEntity.ok(
                ApiResponse.success(technicianSiteService.getDistrictIdsByTechnician(personId)));
    }

    // ── Supprimer ─────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unassign(@PathVariable Integer id) {
        technicianSiteService.unassign(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}