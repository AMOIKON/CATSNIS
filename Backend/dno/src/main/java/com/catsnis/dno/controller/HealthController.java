package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.HealthRequest;
import com.catsnis.dno.dto.HealthResponse;
import com.catsnis.dno.service.HealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/healths")
@RequiredArgsConstructor
public class HealthController {
    private  final HealthService healthService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HealthResponse>> getHealthById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(healthService.getHealthById(id)));
    }
    @GetMapping
    public ResponseEntity<ApiResponse<Page<HealthResponse>>> getAllHealths(
            Pageable pageable,
            @RequestParam(required = false) Integer districtId,
            @RequestParam(required = false) Integer regionId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(healthService.getAllHealths(pageable, districtId, regionId, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HealthResponse>> saveHealth(@RequestBody HealthRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Health créé avec succès", healthService.saveHealth(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HealthResponse>> updateHealth(
            @PathVariable Integer id,
            @RequestBody HealthRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Health mis à jour avec succès", healthService.updateHealth(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHealth(@PathVariable Integer id) {
        healthService.deleteHealth(id);
        return ResponseEntity.ok(ApiResponse.success("Health supprimé avec succès", null));
    }





}
