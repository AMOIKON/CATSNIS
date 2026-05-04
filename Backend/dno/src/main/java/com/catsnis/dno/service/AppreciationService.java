package com.catsnis.dno.service;
import com.catsnis.dno.dto.AppreciationRequest;
import com.catsnis.dno.dto.AppreciationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface AppreciationService {
    AppreciationResponse         getAppreciationById(Integer id);
    Page<AppreciationResponse>   getAllAppreciations(Pageable pageable, String keyword);
    AppreciationResponse         saveAppreciation(AppreciationRequest request);
    AppreciationResponse         updateAppreciation(Integer id, AppreciationRequest request);
    void                         deleteAppreciation(Integer id);
}