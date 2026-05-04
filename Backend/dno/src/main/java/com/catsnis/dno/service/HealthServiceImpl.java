package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.HealthRequest;
import com.catsnis.dno.dto.HealthResponse;
import com.catsnis.dno.entity.District;
import com.catsnis.dno.entity.Health;
import com.catsnis.dno.entity.Region;
import com.catsnis.dno.repository.DistrictRepository;
import com.catsnis.dno.repository.HealthRepository;
import com.catsnis.dno.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HealthServiceImpl  implements HealthService{
    private  final HealthRepository healthRepository;
    private final DistrictRepository districtRepository;
    private final RegionRepository regionRepository;

    @Override
    @Transactional
    public HealthResponse getHealthById(Integer id) {
        Health health = healthRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("Etablissement non touvé avec l' id :" +id));
        return mapToResponse(health);
    }

    @Override
    @Transactional
    public Page<HealthResponse> getAllHealths(Pageable pageable, Integer districtId, Integer regionId, String keyword) {
        return healthRepository.findAllWithFilters(pageable, districtId, regionId, keyword).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public HealthResponse saveHealth(HealthRequest request) {
        District district = districtRepository.findById(request.getDistrictId()).
                orElseThrow(()-> new ResourceNotFoundException("District non trouvé avec l'id :" + request.getDistrictId()));
        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(()-> new ResourceNotFoundException("Region non trouvée avec l'id :" + request.getRegionId()));
        Health health = Health.builder()
                .healthName(request.getHealthName())
                .district(district)
                .region(region)
                .build();
        return  mapToResponse(healthRepository.save(health));
    }

    @Override
    @Transactional
    public HealthResponse updateHealth(Integer id, HealthRequest request) {
        Health health = healthRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Etablissement  non trouvée avec l' Id :" +id));

        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(()-> new ResourceNotFoundException("Region non trouvée avec l'Id :" + id));

        District district = districtRepository.findById(request.getDistrictId())
                .orElseThrow(()-> new ResourceNotFoundException("District non trouvée avec l'Id :" + id));

        health.setHealthName(request.getHealthName());
        health.setDistrict(district);
        health.setRegion(region);
        return mapToResponse(healthRepository.save(health));
    }

    @Override
    @Transactional
    public void deleteHealth(Integer id) {
        Health health = healthRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Health non trouvé avec l'id : " + id));
        healthRepository.delete(health);
    }

    private HealthResponse mapToResponse(Health health){
        return  HealthResponse.builder()
                .id(health.getId())
                .healthName(health.getHealthName())
                .districtName(health.getDistrict().getDistrictName())
                .Region(health.getRegion().getRegionName())
                .build();
    }



}
