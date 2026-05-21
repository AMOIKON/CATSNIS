package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.InterventionRequest;
import com.catsnis.dno.dto.InterventionResponse;
import com.catsnis.dno.service.InterventionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/interventions")
@RequiredArgsConstructor
public class InterventionController {

    private final InterventionService interventionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InterventionResponse>>> getAll(
            Pageable pageable,
            @RequestParam(required = false) Integer regionId,
            @RequestParam(required = false) Integer districtId,
            @RequestParam(required = false) Integer healthId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                interventionService.getAllInterventions(
                        pageable, regionId, districtId, healthId, keyword)));
    }

    @GetMapping("/stats/minutes")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMinutesStats() {
        long enLigne = interventionService.getTotalMinutesEnLigne()  != null
                ? interventionService.getTotalMinutesEnLigne()  : 0L;
        long surSite = interventionService.getTotalMinutesSurSite() != null
                ? interventionService.getTotalMinutesSurSite() : 0L;
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalEnLigne", enLigne);
        stats.put("totalSurSite", surSite);
        stats.put("totalGlobal",  enLigne + surSite);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InterventionResponse>> getById(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                interventionService.getInterventionById(id)));
    }

    // ✅ SUPER_ADMIN ajouté — était exclu → causait le 403
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'TECHNICIEN')")
    public ResponseEntity<ApiResponse<InterventionResponse>> save(
            @RequestBody InterventionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Intervention créée avec succès",
                        interventionService.saveIntervention(request)));
    }

    // ✅ SUPER_ADMIN ajouté
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'TECHNICIEN')")
    public ResponseEntity<ApiResponse<InterventionResponse>> update(
            @PathVariable Integer id,
            @RequestBody InterventionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Intervention mise à jour avec succès",
                interventionService.updateIntervention(id, request)));
    }

    // ✅ SUPER_ADMIN ajouté
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        interventionService.deleteIntervention(id);
        return ResponseEntity.ok(
                ApiResponse.success("Intervention supprimée avec succès", null));
    }
}