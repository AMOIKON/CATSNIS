package com.catsnis.dno.controller;


import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.DistrictRequest;
import com.catsnis.dno.dto.DistrictResponse;
import com.catsnis.dno.service.DistrictService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/districts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DistrictController {
    private final DistrictService districtService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DistrictResponse>> getDistrictById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(districtService.getDistrictById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DistrictResponse>>> getAllDistricts(
            Pageable pageable,
            @RequestParam(required = false) Integer regionId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(districtService.getAllDistricts(pageable, regionId, keyword)));
    }



    @GetMapping("/region/{regionId}")
    public ResponseEntity<ApiResponse<List<DistrictResponse>>> getByRegion(
            @PathVariable Integer regionId) {
        return ResponseEntity.ok(ApiResponse.success(
                districtService.getDistrictsByRegionId(regionId)));
    }



    @PostMapping
    public ResponseEntity<ApiResponse<DistrictResponse>> saveDistrict(@RequestBody DistrictRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("District créé avec succès", districtService.saveDistrict(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DistrictResponse>> updateDistrict(
            @PathVariable Integer id,
            @RequestBody DistrictRequest request) {
        return ResponseEntity.ok(ApiResponse.success("District mis à jour avec succès", districtService.updateDistrict(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDistrict(@PathVariable Integer id) {
        districtService.deleteDistrict(id);
        return ResponseEntity.ok(ApiResponse.success("District supprimé avec succès", null));
    }
    }



