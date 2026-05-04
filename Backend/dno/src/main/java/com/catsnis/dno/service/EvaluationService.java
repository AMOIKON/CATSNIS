package com.catsnis.dno.service;
import com.catsnis.dno.dto.EvaluationRequest;
import com.catsnis.dno.dto.EvaluationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
public interface EvaluationService {
    EvaluationResponse         getEvaluationById(Integer id);
    List<EvaluationResponse>   getAllList();
    Page<EvaluationResponse>   getAllEvaluations(Pageable pageable, String keyword);
    EvaluationResponse         saveEvaluation(EvaluationRequest request);
    EvaluationResponse         updateEvaluation(Integer id, EvaluationRequest request);
    void                       deleteEvaluation(Integer id);
}