package com.catsnis.dno.service;
import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.RegionRequest;
import com.catsnis.dno.dto.RegionResponse;
import com.catsnis.dno.entity.Region;
import com.catsnis.dno.repository.RegionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RegionServiceImpl implements RegionService {

    private final RegionRepository regionRepository;


    @Override
    public RegionResponse getRegionById(Integer id) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Région non trouvée avec l'id : " + id));
        return mapToResponse(region);
    }

    @Override
    public Page<RegionResponse> getAllRegions(Pageable pageable, String keyword) {
        return regionRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public RegionResponse saveRegion(RegionRequest request) {
        Region region = Region.builder()
                .regionName(request.getRegionName())
                .build();
        return mapToResponse(regionRepository.save(region));
    }

    @Transactional
    @Override
    public RegionResponse updateRegion(Integer id, RegionRequest request) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Région non trouvée avec l'id : " + id));
        region.setRegionName(request.getRegionName());
        return mapToResponse(regionRepository.save(region));
    }

    @Override
    @Transactional
    public void deleteRegion(Integer id) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Région non trouvée avec l'id : " + id));
        regionRepository.delete(region);
    }

    private RegionResponse mapToResponse(Region region) {
        return RegionResponse.builder()
                .id(region.getId())
                .regionName(region.getRegionName())
                .build();
       }
    }




