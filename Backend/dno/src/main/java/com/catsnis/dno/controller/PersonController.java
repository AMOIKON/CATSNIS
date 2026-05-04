package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.PersonRequest;
import com.catsnis.dno.dto.PersonResponse;
import com.catsnis.dno.service.PersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService personService;

    // ── Récupérer par ID ──────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonResponse>> getPersonById(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                personService.getPersonById(id)));
    }

    // ── Liste complète sans pagination (picker) ───────────────────────────────
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<PersonResponse>>> getAllList() {
        return ResponseEntity.ok(ApiResponse.success(
                personService.getAllList()));
    }

    // ── Liste paginée avec filtres ────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PersonResponse>>> getAllPersons(
            Pageable pageable,
            @RequestParam(required = false) Integer postId,
            @RequestParam(required = false) Integer unitsId,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                personService.getAllPersons(pageable, postId, unitsId, keyword)));
    }

    // ── Créer ─────────────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')") // ✅ SUPER_ADMIN ajouté
    public ResponseEntity<ApiResponse<PersonResponse>> savePerson(
            @RequestBody PersonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Personne créée avec succès",
                        personService.savePerson(request)));
    }

    // ── Mettre à jour ─────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')") // ✅ SUPER_ADMIN ajouté
    public ResponseEntity<ApiResponse<PersonResponse>> updatePerson(
            @PathVariable Integer id,
            @RequestBody PersonRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Personne mise à jour avec succès",
                personService.updatePerson(id, request)));
    }

    // ── Supprimer ─────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')") // ✅ SUPER_ADMIN ajouté
    public ResponseEntity<ApiResponse<Void>> deletePerson(
            @PathVariable Integer id) {
        personService.deletePerson(id);
        return ResponseEntity.ok(ApiResponse.success(
                "Personne supprimée avec succès", null));
    }
}