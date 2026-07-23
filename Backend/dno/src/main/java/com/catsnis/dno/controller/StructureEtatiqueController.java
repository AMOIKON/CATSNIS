package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.StructureEtatiqueRequest;
import com.catsnis.dno.dto.StructureEtatiqueResponse;
import com.catsnis.dno.service.StructureEtatiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/structures-etatiques")
@RequiredArgsConstructor
public class StructureEtatiqueController {

    private final StructureEtatiqueService structureEtatiqueService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StructureEtatiqueResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(structureEtatiqueService.getAllList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StructureEtatiqueResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(structureEtatiqueService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StructureEtatiqueResponse>> create(
            @RequestBody StructureEtatiqueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Structure étatique créée avec succès",
                        structureEtatiqueService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StructureEtatiqueResponse>> update(
            @PathVariable Long id,
            @RequestBody StructureEtatiqueRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Structure étatique modifiée avec succès",
                structureEtatiqueService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        structureEtatiqueService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Structure étatique supprimée avec succès", null));
    }
}