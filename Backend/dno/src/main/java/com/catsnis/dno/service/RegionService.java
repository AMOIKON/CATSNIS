package com.catsnis.dno.service;
import com.catsnis.dno.dto.RegionRequest;
import com.catsnis.dno.dto.RegionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface RegionService {
    RegionResponse         getRegionById(Integer id);
    Page<RegionResponse>   getAllRegions(Pageable pageable, String keyword);
    RegionResponse         saveRegion(RegionRequest request);
    RegionResponse         updateRegion(Integer id, RegionRequest request);
    void                   deleteRegion(Integer id);
}