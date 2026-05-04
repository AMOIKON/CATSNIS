package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.AppreciationRequest;
import com.catsnis.dno.dto.AppreciationResponse;
import com.catsnis.dno.entity.Appreciation;
import com.catsnis.dno.repository.AppreciationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class AppreciationServiceImpl  implements AppreciationService{
    private final AppreciationRepository appreciationRepository;

    @Override
    public AppreciationResponse getAppreciationById(Integer id) {
        Appreciation appreciation = appreciationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appréciation non trouvée avec l'id : " + id));
        return mapToResponse(appreciation);
    }

    @Override
    public Page<AppreciationResponse> getAllAppreciations(Pageable pageable, String keyword) {
        return appreciationRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public AppreciationResponse saveAppreciation(AppreciationRequest request) {
        Appreciation appreciation = Appreciation.builder()
                .appreciateName(request.getAppreciateName())
                .build();
        return mapToResponse(appreciationRepository.save(appreciation));
    }

    @Override
    @Transactional
    public AppreciationResponse updateAppreciation(Integer id, AppreciationRequest request) {
        Appreciation appreciation = appreciationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appréciation non trouvée avec l'id : " + id));
        appreciation.setAppreciateName(request.getAppreciateName());
        return mapToResponse(appreciationRepository.save(appreciation));
    }

    @Override
    @Transactional
    public void deleteAppreciation(Integer id) {
        Appreciation appreciation = appreciationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appréciation non trouvée avec l'id : " + id));
        appreciationRepository.delete(appreciation);
    }

    private AppreciationResponse mapToResponse(Appreciation appreciation) {
        return AppreciationResponse.builder()
                .id(appreciation.getId())
                .appreciateName(appreciation.getAppreciateName())
                .build();
    }
}
