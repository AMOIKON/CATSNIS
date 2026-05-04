package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.*;
import com.catsnis.dno.entity.VehiculeType;
import com.catsnis.dno.service.VehiculeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vehicules")
@RequiredArgsConstructor
public class VehiculeController {

    private final VehiculeService vehiculeService;

    // ── Véhicules ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<VehiculeResponse>> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(vehiculeService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<VehiculeResponse>>> getAll(
            Pageable pageable,
            @RequestParam(required = false) VehiculeType type,
            @RequestParam(required = false) String  statut,
            @RequestParam(required = false) Integer regionId,
            @RequestParam(required = false) String  keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                vehiculeService.getAll(pageable, type, statut, regionId, keyword)));
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<VehiculeResponse>>> getAllList() {
        return ResponseEntity.ok(ApiResponse.success(vehiculeService.getAllList()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<VehiculeResponse>> save(@RequestBody VehiculeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Véhicule créé", vehiculeService.save(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<VehiculeResponse>> update(
            @PathVariable Integer id, @RequestBody VehiculeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Véhicule mis à jour", vehiculeService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        vehiculeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Véhicule supprimé"));
    }

    // ✅ Historique complet d'un véhicule
    @GetMapping("/{id}/historique")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<VehiculeHistoriqueResponse>> getHistorique(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(vehiculeService.getHistorique(id)));
    }

    @GetMapping("/alertes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<VehiculeAlertResponse>>> getAlertes(
            @RequestParam(defaultValue = "30") Integer joursAvance) {
        return ResponseEntity.ok(ApiResponse.success(vehiculeService.getAlertes(joursAvance)));
    }

    // ── Incidents ─────────────────────────────────────────────────────────────

    @GetMapping("/incidents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<VehiculeIncidentResponse>>> getIncidents(
            Pageable pageable,
            @RequestParam(required = false) Integer vehiculeId,
            @RequestParam(required = false) String  statut,
            @RequestParam(required = false) String  keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                vehiculeService.getIncidents(pageable, vehiculeId, statut, keyword)));
    }

    @PostMapping("/incidents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIEN')")
    public ResponseEntity<ApiResponse<VehiculeIncidentResponse>> saveIncident(
            @RequestBody VehiculeIncidentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Incident créé", vehiculeService.saveIncident(request)));
    }

    @PutMapping("/incidents/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIEN')")
    public ResponseEntity<ApiResponse<VehiculeIncidentResponse>> updateIncident(
            @PathVariable Integer id, @RequestBody VehiculeIncidentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Incident mis à jour",
                vehiculeService.updateIncident(id, request)));
    }

    @DeleteMapping("/incidents/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable Integer id) {
        vehiculeService.deleteIncident(id);
        return ResponseEntity.ok(ApiResponse.success("Incident supprimé"));
    }

    // ── Maintenances ──────────────────────────────────────────────────────────

    @GetMapping("/maintenances")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<VehiculeMaintenanceResponse>>> getMaintenances(
            Pageable pageable,
            @RequestParam(required = false) Integer vehiculeId,
            @RequestParam(required = false) String  statut,
            @RequestParam(required = false) String  keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                vehiculeService.getMaintenances(pageable, vehiculeId, statut, keyword)));
    }

    @PostMapping("/maintenances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIEN')")
    public ResponseEntity<ApiResponse<VehiculeMaintenanceResponse>> saveMaintenance(
            @RequestBody VehiculeMaintenanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Maintenance créée", vehiculeService.saveMaintenance(request)));
    }

    @PutMapping("/maintenances/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIEN')")
    public ResponseEntity<ApiResponse<VehiculeMaintenanceResponse>> updateMaintenance(
            @PathVariable Integer id, @RequestBody VehiculeMaintenanceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Maintenance mise à jour",
                vehiculeService.updateMaintenance(id, request)));
    }

    @DeleteMapping("/maintenances/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMaintenance(@PathVariable Integer id) {
        vehiculeService.deleteMaintenance(id);
        return ResponseEntity.ok(ApiResponse.success("Maintenance supprimée"));
    }

    // ── Affectations ──────────────────────────────────────────────────────────

    @GetMapping("/affectations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<VehiculeAffectationResponse>>> getAffectations(
            Pageable pageable,
            @RequestParam(required = false) Integer vehiculeId,
            @RequestParam(required = false) Integer personId,
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(
                vehiculeService.getAffectations(pageable, vehiculeId, personId, active)));
    }

    @GetMapping("/{id}/affectation-active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<VehiculeAffectationResponse>> getAffectationActive(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(vehiculeService.getAffectationActive(id)));
    }

    @PostMapping("/affectations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<VehiculeAffectationResponse>> affecter(
            @RequestBody VehiculeAffectationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Affectation créée", vehiculeService.affecter(request)));
    }

    @PutMapping("/affectations/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<VehiculeAffectationResponse>> updateAffectation(
            @PathVariable Long id, @RequestBody VehiculeAffectationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Affectation mise à jour",
                vehiculeService.updateAffectation(id, request)));
    }

    @PutMapping("/{id}/cloturer-affectation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cloturerAffectation(@PathVariable Integer id) {
        vehiculeService.cloturerAffectation(id);
        return ResponseEntity.ok(ApiResponse.success("Affectation clôturée"));
    }

    // ── À ajouter dans VehiculeController.java ───────────────────────────────────

    @PostMapping("/{id}/renouveler-document")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','LOGISTICIEN')")
    public ResponseEntity<ApiResponse<VehiculeDocumentHistoriqueResponse>> renouvelerDocument(
            @PathVariable Integer id,
            @RequestBody VehiculeDocumentRenewalRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Document renouvelé",
                vehiculeService.renouvelerDocument(id, request)));
    }

    @GetMapping("/{id}/documents-historique")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<VehiculeDocumentHistoriqueResponse>>> getDocumentsHistorique(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(vehiculeService.getDocumentsHistorique(id)));
    }
}