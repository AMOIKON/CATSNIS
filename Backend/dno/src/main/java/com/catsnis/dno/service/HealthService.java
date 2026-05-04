package com.catsnis.dno.service;
import com.catsnis.dno.dto.HealthRequest;
import com.catsnis.dno.dto.HealthResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface HealthService {
    HealthResponse         getHealthById(Integer id);
    Page<HealthResponse>   getAllHealths(Pageable pageable, Integer districtId, Integer regionId, String keyword);
    HealthResponse         saveHealth(HealthRequest request);
    HealthResponse         updateHealth(Integer id, HealthRequest request);
    void                   deleteHealth(Integer id);
}