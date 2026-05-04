package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.RegionRequest;
import com.catsnis.dno.dto.RegionResponse;
import com.catsnis.dno.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {
    private final RegionService regionService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RegionResponse>> getRegionById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(regionService.getRegionById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RegionResponse>>> getAllRegions(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(regionService.getAllRegions(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RegionResponse>> saveRegion(@RequestBody RegionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Région créée avec succès", regionService.saveRegion(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RegionResponse>> updateRegion(
            @PathVariable Integer id,
            @RequestBody RegionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Région mise à jour avec succès", regionService.updateRegion(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRegion(@PathVariable Integer id) {
        regionService.deleteRegion(id);
        return ResponseEntity.ok(ApiResponse.success("Région supprimée avec succès", null));
    }
}


