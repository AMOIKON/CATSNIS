package com.catsnis.dno.controller;

import com.catsnis.dno.common.response.ApiResponse;
import com.catsnis.dno.dto.EvaluationRequest;
import com.catsnis.dno.dto.EvaluationResponse;
import com.catsnis.dno.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvaluationResponse>> getEvaluationById(
            @PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(
                evaluationService.getEvaluationById(id)));
    }

    // ✅ Ajouté — liste complète pour le formulaire d'intervention
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<EvaluationResponse>>> getAllList() {
        return ResponseEntity.ok(ApiResponse.success(
                evaluationService.getAllList()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<EvaluationResponse>>> getAllEvaluations(
            Pageable pageable,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(
                evaluationService.getAllEvaluations(pageable, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EvaluationResponse>> saveEvaluation(
            @RequestBody EvaluationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evaluation créée avec succès",
                        evaluationService.saveEvaluation(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EvaluationResponse>> updateEvaluation(
            @PathVariable Integer id,
            @RequestBody EvaluationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Evaluation mise à jour avec succès",
                evaluationService.updateEvaluation(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(
            @PathVariable Integer id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.ok(ApiResponse.success(
                "Evaluation supprimée avec succès", null));
    }
}