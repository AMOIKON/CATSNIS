package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.UnitsRequest;
import com.catsnis.dno.dto.UnitsResponse;
import com.catsnis.dno.service.UnitsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/units")
@RequiredArgsConstructor
public class UnitsController {

    private final UnitsService unitsService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UnitsResponse>> getUnitsById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(unitsService.getUnitsById(id)));
    }
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UnitsResponse>>> getAllUnits(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(unitsService.getAllUnits(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UnitsResponse>> saveUnits(@RequestBody UnitsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Unité créée avec succès", unitsService.saveUnits(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UnitsResponse>> updateUnits(
            @PathVariable Integer id,
            @RequestBody UnitsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Unité mise à jour avec succès", unitsService.updateUnits(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUnits(@PathVariable Integer id) {
        unitsService.deleteUnits(id);
        return ResponseEntity.ok(ApiResponse.success("Unité supprimée avec succès", null));
    }


}
