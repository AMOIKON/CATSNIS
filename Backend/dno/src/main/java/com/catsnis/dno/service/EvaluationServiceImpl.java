package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.EvaluationRequest;
import com.catsnis.dno.dto.EvaluationResponse;
import com.catsnis.dno.entity.Evaluation;
import com.catsnis.dno.repository.EvaluationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EvaluationServiceImpl implements EvaluationService {

    private final EvaluationRepository evaluationRepository;

    @Override
    public EvaluationResponse getEvaluationById(Integer id) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Evaluation non trouvée avec l'id : " + id));
        return mapToResponse(evaluation);
    }

    // ✅ Ajouté — liste complète pour le formulaire d'intervention
    @Override
    public List<EvaluationResponse> getAllList() {
        return evaluationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<EvaluationResponse> getAllEvaluations(Pageable pageable, String keyword) {
        return evaluationRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public EvaluationResponse saveEvaluation(EvaluationRequest request) {
        Evaluation evaluation = Evaluation.builder()
                .evlName(request.getEvlName())
                .build();
        return mapToResponse(evaluationRepository.save(evaluation));
    }

    @Override
    @Transactional
    public EvaluationResponse updateEvaluation(Integer id, EvaluationRequest request) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Evaluation non trouvée avec l'id : " + id));
        evaluation.setEvlName(request.getEvlName());
        return mapToResponse(evaluationRepository.save(evaluation));
    }

    @Override
    @Transactional
    public void deleteEvaluation(Integer id) {
        Evaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Evaluation non trouvée avec l'id : " + id));
        evaluationRepository.delete(evaluation);
    }

    private EvaluationResponse mapToResponse(Evaluation evaluation) {
        return EvaluationResponse.builder()
                .id(evaluation.getId())
                .evlName(evaluation.getEvlName())
                .build();
    }
}