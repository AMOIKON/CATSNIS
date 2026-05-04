package com.catsnis.dno.controller;


import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.AppsRequest;
import com.catsnis.dno.dto.AppsResponse;
import com.catsnis.dno.service.AppsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/apps")
@RequiredArgsConstructor
public class AppsController {

    private final AppsService appsService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppsResponse>> getAppsById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(appsService.getAppsById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AppsResponse>>> getAllApps(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(appsService.getAllApps(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppsResponse>> saveApps(@RequestBody AppsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Application créée avec succès", appsService.saveApps(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppsResponse>> updateApps(
            @PathVariable Integer id,
            @RequestBody AppsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Application mise à jour avec succès", appsService.updateApps(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteApps(@PathVariable Integer id) {
        appsService.deleteApps(id);
        return ResponseEntity.ok(ApiResponse.success("Application supprimée avec succès", null));
    }



}
