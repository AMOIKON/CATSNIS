package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.Fourniture.FournitureCategorie;
import com.catsnis.dno.entity.Fourniture.FournitureStatut;
import com.catsnis.dno.service.FournitureService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/fournitures")
@RequiredArgsConstructor
public class FournitureController {

    private final FournitureService fournitureService;

    // ── Fournitures ───────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FournitureResponse>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(fournitureService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<FournitureResponse>>> getAll(
            Pageable pageable,
            @RequestParam(required = false) FournitureCategorie categorie,
            @RequestParam(required = false) FournitureStatut    statut,
            @RequestParam(required = false) String              keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                fournitureService.getAll(pageable, categorie, statut, keyword)));
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FournitureResponse>>> getAllList() {
        return ResponseEntity.ok(ApiResponse.success(fournitureService.getAllList()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','LOGISTICIEN')")
    public ResponseEntity<ApiResponse<FournitureResponse>> save(@RequestBody FournitureRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fourniture créée", fournitureService.save(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','LOGISTICIEN')")
    public ResponseEntity<ApiResponse<FournitureResponse>> update(
            @PathVariable Integer id, @RequestBody FournitureRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Fourniture mise à jour",
                fournitureService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        fournitureService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Fourniture supprimée"));
    }

    // ── Déploiements ──────────────────────────────────────────────────────────

    @GetMapping("/deploiements")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<FournitureDeploiementResponse>>> getDeploiements(
            Pageable pageable,
            @RequestParam(required = false) Integer fournitureId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String  keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                fournitureService.getDeploiements(pageable, fournitureId, active, keyword)));
    }

    @GetMapping("/{id}/deploiements")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FournitureDeploiementResponse>>> getDeploiementsByFourniture(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                fournitureService.getDeploiementsByFourniture(id)));
    }

    @PostMapping("/deploiements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','LOGISTICIEN','TECHNICIEN')")
    public ResponseEntity<ApiResponse<FournitureDeploiementResponse>> deployer(
            @RequestBody FournitureDeploiementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Déploiement effectué", fournitureService.deployer(request)));
    }

    @PutMapping("/deploiements/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','LOGISTICIEN')")
    public ResponseEntity<ApiResponse<FournitureDeploiementResponse>> updateDeploiement(
            @PathVariable Integer id, @RequestBody FournitureDeploiementRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Déploiement mis à jour",
                fournitureService.updateDeploiement(id, request)));
    }

    @PutMapping("/deploiements/{id}/cloturer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','LOGISTICIEN')")
    public ResponseEntity<ApiResponse<Void>> cloturerDeploiement(@PathVariable Integer id) {
        fournitureService.cloturerDeploiement(id);
        return ResponseEntity.ok(ApiResponse.success("Déploiement clôturé"));
    }

    @DeleteMapping("/deploiements/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDeploiement(@PathVariable Integer id) {
        fournitureService.deleteDeploiement(id);
        return ResponseEntity.ok(ApiResponse.success("Déploiement supprimé"));
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Long>>> stats() {
        return ResponseEntity.ok(ApiResponse.success(fournitureService.stats()));
    }
}