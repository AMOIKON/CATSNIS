package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.AppreciationRequest;
import com.catsnis.dno.dto.AppreciationResponse;
import com.catsnis.dno.service.AppreciationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appreciations")
@RequiredArgsConstructor
public class AppreciationController {

    private final AppreciationService appreciationService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppreciationResponse>> getAppreciationById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(appreciationService.getAppreciationById(id)));
    }
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AppreciationResponse>>> getAllAppreciations(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(appreciationService.getAllAppreciations(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppreciationResponse>> saveAppreciation(@RequestBody AppreciationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appréciation créée avec succès", appreciationService.saveAppreciation(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppreciationResponse>> updateAppreciation(
            @PathVariable Integer id,
            @RequestBody AppreciationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Appréciation mise à jour avec succès", appreciationService.updateAppreciation(id, request)));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAppreciation(@PathVariable Integer id) {
        appreciationService.deleteAppreciation(id);
        return ResponseEntity.ok(ApiResponse.success("Appréciation supprimée avec succès", null));
    }




}
