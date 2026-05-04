package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.DistrictRequest;
import com.catsnis.dno.dto.DistrictResponse;
import com.catsnis.dno.entity.District;
import com.catsnis.dno.entity.Region;
import com.catsnis.dno.repository.DistrictRepository;
import com.catsnis.dno.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DistrictServiceImpl implements DistrictService {

    private final DistrictRepository districtRepository;
    private final RegionRepository   regionRepository;

    @Override
    @Transactional
    public DistrictResponse getDistrictById(Integer id) {
        District district = districtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "District non trouvé avec l'id : " + id));
        return mapToResponse(district);
    }

    @Override
    @Transactional
    public Page<DistrictResponse> getAllDistricts(
            Pageable pageable, Integer regionId, String keyword) {
        return districtRepository.findAllWithFilters(pageable, regionId, keyword)
                .map(this::mapToResponse);
    }
    // ✅ Nouvelle méthode — districts par région pour BookletFormModal
    @Override
    @Transactional
    public List<DistrictResponse> getDistrictsByRegionId(Integer regionId) {
        return districtRepository.findByRegionIdOrderByDistrictNameAsc(regionId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional
    public DistrictResponse saveDistrict(DistrictRequest request) {
        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Région non trouvée avec l'id : " + request.getRegionId()));
        District district = District.builder()
                .districtName(request.getDistrictName())
                .region(region)
                .build();
        return mapToResponse(districtRepository.save(district));
    }

    @Override
    @Transactional
    public DistrictResponse updateDistrict(Integer id, DistrictRequest request) {
        District district = districtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "District non trouvé avec l'id : " + id));
        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Région non trouvée avec l'id : " + request.getRegionId()));
        district.setDistrictName(request.getDistrictName());
        district.setRegion(region);
        return mapToResponse(districtRepository.save(district));
    }

    @Override
    @Transactional
    public void deleteDistrict(Integer id) {
        District district = districtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "District non trouvé avec l'id : " + id));
        districtRepository.delete(district);
    }

    private DistrictResponse mapToResponse(District district) {
        return DistrictResponse.builder()
                .id(district.getId())
                .DistrictName(district.getDistrictName())
                .regionDistrict(district.getRegion().getRegionName())
                .build();
    }
}