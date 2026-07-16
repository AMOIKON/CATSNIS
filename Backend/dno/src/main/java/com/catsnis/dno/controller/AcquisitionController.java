package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.AcquisitionRequest;
import com.catsnis.dno.dto.AcquisitionResponse;
import com.catsnis.dno.service.AcquisitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/acquisitions")
@RequiredArgsConstructor
public class AcquisitionController {
    private final AcquisitionService acquisitionService;


    // ── Disponibles ← DOIT ÊTRE AVANT /{id} ──────────────────────────
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<AcquisitionResponse>>> getAvailable(
            @RequestParam(required = false) Integer typesId) {
        return ResponseEntity.ok(ApiResponse.success(
                acquisitionService.getAvailable(typesId)));
    }

    // ── Compteur équipements hors base ← DOIT ÊTRE AVANT /{id} ────────
    @GetMapping("/stats/hors-base")
    public ResponseEntity<ApiResponse<Long>> getHorsBaseCount() {
        return ResponseEntity.ok(ApiResponse.success(
                acquisitionService.countHorsBaseEquipment()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AcquisitionResponse>> getAcquisitionById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(acquisitionService.getAcquisitionById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AcquisitionResponse>>> getAllAcquisitions(
            Pageable pageable,
            @RequestParam(required = false) Integer typesId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                acquisitionService.getAllAcquisitions(pageable, typesId, status, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AcquisitionResponse>> saveAcquisition(@RequestBody AcquisitionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Acquisition créée avec succès", acquisitionService.saveAcquisition(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AcquisitionResponse>> updateAcquisition(
            @PathVariable Integer id,
            @RequestBody AcquisitionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Acquisition mise à jour avec succès", acquisitionService.updateAcquisition(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAcquisition(@PathVariable Integer id) {
        acquisitionService.deleteAcquisition(id);
        return ResponseEntity.ok(ApiResponse.success("Acquisition supprimée avec succès", null));
    }
}