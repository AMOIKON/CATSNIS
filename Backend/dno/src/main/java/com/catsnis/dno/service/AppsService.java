package com.catsnis.dno.service;
import com.catsnis.dno.dto.AppsRequest;
import com.catsnis.dno.dto.AppsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface AppsService {
    AppsResponse         getAppsById(Integer id);
    Page<AppsResponse>   getAllApps(Pageable pageable, String keyword);
    AppsResponse         saveApps(AppsRequest request);
    AppsResponse         updateApps(Integer id, AppsRequest request);
    void                 deleteApps(Integer id);
}