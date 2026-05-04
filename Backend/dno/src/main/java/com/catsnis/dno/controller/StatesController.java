package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.StatesRequest;
import com.catsnis.dno.dto.StatesResponse;
import com.catsnis.dno.service.StatesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/states")
@RequiredArgsConstructor
public class StatesController {
    private final StatesService statesService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StatesResponse>> getStatesById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(statesService.getStatesById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StatesResponse>>> getAllStates(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(statesService.getAllStates(pageable, keyword)));
       }

    @PostMapping
    public ResponseEntity<ApiResponse<StatesResponse>> saveStates(@RequestBody StatesRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("State créé avec succès", statesService.saveStates(request)));
       }
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StatesResponse>> updateStates(
            @PathVariable Integer id,
            @RequestBody StatesRequest request) {
        return ResponseEntity.ok(ApiResponse.success("State mis à jour avec succès", statesService.updateStates(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStates(@PathVariable Integer id) {
        statesService.deleteStates(id);
        return ResponseEntity.ok(ApiResponse.success("State supprimé avec succès", null));
    }



    }
