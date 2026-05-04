package com.catsnis.dno.service;

import com.catsnis.dno.common.exception.ResourceNotFoundException;
import com.catsnis.dno.dto.AppsRequest;
import com.catsnis.dno.dto.AppsResponse;
import com.catsnis.dno.entity.Apps;
import com.catsnis.dno.repository.AppsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppsServiceImpl implements AppsService {

    private final AppsRepository appsRepository;

    @Override
    public AppsResponse getAppsById(Integer id) {
        Apps apps = appsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application non trouvée avec l'id : " + id));
        return mapToResponse(apps);
    }

    @Override
    public Page<AppsResponse> getAllApps(Pageable pageable, String keyword) {
        return appsRepository.findAllWithFilters(pageable, keyword)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public AppsResponse saveApps(AppsRequest request) {
        Apps apps = Apps.builder()
                .appName(request.getAppName())
                .icon(request.getIcon())     // ← corrigé
                .color(request.getColor())   // ← corrigé
                .image(request.getImage())   // ← corrigé
                .build();
        return mapToResponse(appsRepository.save(apps));
    }

    @Override
    @Transactional
    public AppsResponse updateApps(Integer id, AppsRequest request) {
        Apps apps = appsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application non trouvée avec l'id : " + id));
        apps.setAppName(request.getAppName());
        apps.setIcon(request.getIcon());     // ← corrigé
        apps.setColor(request.getColor());   // ← corrigé
        apps.setImage(request.getImage());
        return mapToResponse(appsRepository.save(apps));
    }

    @Override
    @Transactional
    public void deleteApps(Integer id) {
        Apps apps = appsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Application non trouvée avec l'id : " + id));
        appsRepository.delete(apps);
    }

    private AppsResponse mapToResponse(Apps apps) {
        return AppsResponse.builder()
                .id(apps.getId())
                .appsName(apps.getAppName())
                .icon(apps.getIcon()   != null ? apps.getIcon()  : "bi-app-indicator")
                .color(apps.getColor() != null ? apps.getColor() : "#616161")
                .image(apps.getImage() != null ? apps.getImage() : "")
                .build();
    }
}