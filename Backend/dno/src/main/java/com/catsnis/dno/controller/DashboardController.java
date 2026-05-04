package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.DashboardStatsResponse;
import com.catsnis.dno.dto.MapStatsResponse;
import com.catsnis.dno.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // ── Stats globales ────────────────────────────────────────────────────────
    @GetMapping("/stats")
    @Cacheable("dashboard-stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getStats()));
    }

    // ── Stats carte avec filtres géographiques ✅ ajouté ──────────────────────
    @GetMapping("/map-stats")
    public ResponseEntity<ApiResponse<MapStatsResponse>> getMapStats(
            @RequestParam(required = false) Integer regionId,
            @RequestParam(required = false) Integer districtId,
            @RequestParam(required = false) Integer healthId) {
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMapStats(regionId, districtId, healthId)));
    }
}