package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.UnitsRequest;
import com.catsnis.dno.dto.UnitsResponse;
import com.catsnis.dno.entity.Units;
import com.catsnis.dno.repository.UnitsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UnitsServiceImpl implements UnitsService{
    private final UnitsRepository unitsRepository;

    @Override
    public UnitsResponse getUnitsById(Integer id) {
        Units units = unitsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée avec l'id : " + id));
        return mapToResponse(units);
    }

    @Override
    public Page<UnitsResponse> getAllUnits(Pageable pageable, String keyword) {
        return unitsRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public UnitsResponse saveUnits(UnitsRequest request) {
        Units units = Units.builder()
                .unitName(request.getUnitName())
                .build();
        return mapToResponse(unitsRepository.save(units));
    }

    @Override
    @Transactional
    public UnitsResponse updateUnits(Integer id, UnitsRequest request) {
        Units units = unitsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée avec l'id : " + id));
        units.setUnitName(request.getUnitName());
        return mapToResponse(unitsRepository.save(units));
    }

    @Override
    @Transactional
    public void deleteUnits(Integer id) {
        Units units = unitsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unité non trouvée avec l'id : " + id));
        unitsRepository.delete(units);
    }

    private UnitsResponse mapToResponse(Units units) {
        return UnitsResponse.builder()
                .id(units.getId())
                .unitName(units.getUnitName())
                .build();
    }
}
