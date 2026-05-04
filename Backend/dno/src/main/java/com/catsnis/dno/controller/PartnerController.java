package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.PartnerRequest;
import com.catsnis.dno.dto.PartnerResponse;
import com.catsnis.dno.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerService partnerService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnerResponse>> getPartnerById(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                partnerService.getPartnerById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PartnerResponse>>> getAllPartners(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                partnerService.getAllPartners(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PartnerResponse>> savePartner(
            @RequestBody PartnerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Partenaire créé avec succès",
                        partnerService.savePartner(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnerResponse>> updatePartner(
            @PathVariable Integer id,
            @RequestBody PartnerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Partenaire mis à jour avec succès",
                partnerService.updatePartner(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePartner(
            @PathVariable Integer id) {
        partnerService.deletePartner(id);
        return ResponseEntity.ok(ApiResponse.success(
                "Partenaire supprimé avec succès", null));
    }
}