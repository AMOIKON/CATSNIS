package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.TypesRequest;
import com.catsnis.dno.dto.TypesResponse;
import com.catsnis.dno.service.TypesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/types")
@RequiredArgsConstructor
public class TypesController {

    private final TypesService typesService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TypesResponse>> getTypesById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(typesService.getTypesById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TypesResponse>>> getAllTypes(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(typesService.getAllTypes(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TypesResponse>> saveTypes(@RequestBody TypesRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Type créé avec succès", typesService.saveTypes(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TypesResponse>> updateTypes(
            @PathVariable Integer id,
            @RequestBody TypesRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Type mis à jour avec succès", typesService.updateTypes(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTypes(@PathVariable Integer id) {
        try {
            typesService.deleteTypes(id);
            return ResponseEntity.ok(ApiResponse.success("Type supprimé", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT) .body(ApiResponse.error(e.getMessage()));

        }
    }


}
